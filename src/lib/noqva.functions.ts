import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev";

type ChatTurn = { role: "user" | "assistant"; content: string };

function gatewayMessage(status: number, body: string) {
  if (status === 429) return "Noqva AI is busy right now — please try again in a moment.";
  if (status === 402) return "AI credits are exhausted. Add credits to keep generating.";
  if (status === 403) return "This AI model isn't available for this workspace right now.";
  return `AI request failed (${status}). ${body.slice(0, 200)}`;
}

/** Streaming-free chat completion used for normal chat + document drafting. */
export const chatComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { turns: ChatTurn[]; mode?: "chat" | "document" }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const system =
      data.mode === "document"
        ? "You are Noqva AI, a document studio. Produce a complete, well-structured document in clean markdown using headings, short paragraphs and bullet lists. No preamble, no closing chatter — just the document."
        : "You are Noqva AI, a concise, helpful multimodal assistant. Answer in clean markdown. Keep answers tight unless depth is requested.";

    const res = await fetch(`${GATEWAY}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning_effort: "low",
        messages: [{ role: "system", content: system }, ...data.turns.slice(-20)],
      }),
    });

    if (!res.ok) throw new Error(gatewayMessage(res.status, await res.text()));
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Noqva AI returned an empty response.");
    return { content };
  });

/** Creates a 5-second image-to-video job on the AI gateway. */
export const startVideoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageUrl: string; prompt?: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const imageRes = await fetch(data.imageUrl);
    if (!imageRes.ok) throw new Error("Could not load the source image for the video.");
    const mime = imageRes.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    const bytes = new Uint8Array(await imageRes.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    const base64 = btoa(binary);

    const motion =
      data.prompt?.trim() ||
      "Bring this image to life with subtle, cinematic motion and a slow camera push-in. Keep the subject and composition unchanged. Soft ambient sound. No dialogue.";

    const res = await fetch(`${GATEWAY}/v1/videos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-omni-1.1-flash",
        input: [
          { type: "text", text: motion },
          { type: "image", data: base64, mime_type: mime === "image/png" ? "image/png" : "image/jpeg" },
        ],
        response_format: { type: "video", resolution: "720p", duration: "5s" },
        generation_config: { video_config: { task: "image_to_video" } },
      }),
    });

    if (!res.ok) throw new Error(gatewayMessage(res.status, await res.text()));
    const job = (await res.json()) as { id: string };
    return { id: job.id };
  });

/** Polls a video job; once complete, stores the MP4 and returns a durable signed URL. */
export const checkVideoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const res = await fetch(`${GATEWAY}/v1/videos/${data.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(gatewayMessage(res.status, await res.text()));
    const job = (await res.json()) as {
      status: string;
      progress?: number;
      error?: { message?: string };
    };

    if (job.status === "failed") {
      return {
        status: "failed" as const,
        error: job.error?.message ?? "Video generation failed. Try a different image or prompt.",
      };
    }
    if (job.status !== "completed") {
      return { status: "pending" as const, progress: job.progress ?? 0 };
    }

    const content = await fetch(`${GATEWAY}/v1/videos/${data.id}/content`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!content.ok) throw new Error("Could not download the finished video.");
    const buffer = await content.arrayBuffer();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${context.userId}/${data.id}.mp4`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("noqva-videos")
      .upload(path, buffer, { contentType: "video/mp4", upsert: true });
    if (uploadError && !uploadError.message.includes("exists")) throw new Error(uploadError.message);

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("noqva-videos")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signError || !signed) throw new Error("Could not prepare the video for playback.");

    return { status: "completed" as const, videoUrl: signed.signedUrl };
  });
