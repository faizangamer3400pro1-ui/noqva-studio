import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { generateImage, verifyImageRequest } from "@/lib/image-gateway.server";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  stream: z.boolean().optional().default(true),
});

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyImageRequest(request))) {
          return new Response("Please sign in again to generate an image.", { status: 401 });
        }

        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Enter a valid image description.", { status: 400 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI image generation is not configured.", { status: 500 });

        const upstream = await generateImage(apiKey, parsed.data.prompt, parsed.data.stream);
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});