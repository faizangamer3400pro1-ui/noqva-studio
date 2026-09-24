import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

const GATEWAY = "https://ai.gateway.lovable.dev";
const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";

export async function verifyImageRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!token || !url || !key) return false;

  const client = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getClaims(token);
  return !error && Boolean(data?.claims?.sub);
}

export function generateImage(apiKey: string, prompt: string, stream = true) {
  const refinedPrompt = [
    prompt.trim(),
    "Render the request faithfully as one clear, coherent composition.",
    "Use a clearly defined subject, intentional framing, accurate anatomy and geometry, crisp focus, and refined detail.",
    "Avoid visual clutter, duplicate subjects, warped features, muddy textures, and accidental text.",
  ].join("\n");

  return fetch(`${GATEWAY}/v1/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: refinedPrompt,
      size: "1536x1536",
      quality: "max",
      ...(stream ? { stream: true, partial_images: 1 } : {}),
    }),
  });
}