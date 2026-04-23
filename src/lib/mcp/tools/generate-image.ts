import { z } from "zod";
import type { ImagesResponse } from "openai/resources/images.js";
import { getOpenAIClient } from "../openai";
import { saveImage } from "../save-image";

export const generateImageInputSchema = {
  prompt: z
    .string()
    .min(1)
    .max(32000)
    .describe("Text description of the image to generate"),
  size: z
    .enum(["auto", "1024x1024", "1536x1024", "1024x1536"])
    .optional()
    .default("auto")
    .describe("Image dimensions"),
  n: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .default(1)
    .describe("Number of images"),
  output_format: z
    .enum(["png", "webp", "jpeg"])
    .optional()
    .default("png")
    .describe("Output file format"),
  background: z
    .enum(["auto", "transparent", "opaque"])
    .optional()
    .default("auto")
    .describe("Background type"),
  quality: z
    .enum(["low", "medium", "high"])
    .optional()
    .default("low")
    .describe(
      "Generation quality; higher quality results in longer generation time and increased cost. only use when the user explicitly requests it or when the prompt is complex and likely to require more time to generate, otherwise low quality is recommended for faster generation and lower cost",
    ),
};

export type GenerateImageInput = {
  prompt: string;
  size?: "auto" | "1024x1024" | "1536x1024" | "1024x1536";
  n?: number;
  output_format?: "png" | "webp" | "jpeg";
  background?: "auto" | "transparent" | "opaque";
  quality?: "low" | "medium" | "high";
};

export async function generateImage(userId: string, input: GenerateImageInput) {
  const client = getOpenAIClient(userId);

  console.log(
    `[generate] user=${userId} prompt="${input.prompt.slice(0, 80)}" n=${input.n ?? 1}`,
  );
  const response = (await client.images.generate({
    model: "gpt-image-2",
    prompt: input.prompt,
    n: input.n ?? 1,
    size: input.size === "auto" || !input.size ? undefined : input.size,
    output_format: input.output_format ?? "png",
    background:
      input.background === "auto" || !input.background
        ? undefined
        : input.background,
    quality: input.quality ?? "medium",
  })) as ImagesResponse;

  const revisedPrompt = (response.data?.[0] as { revised_prompt?: string })
    ?.revised_prompt;

  const format = input.output_format ?? "png";
  const urls = await Promise.all(
    (response.data ?? []).map((img) => saveImage(img.b64_json ?? "", format)),
  );

  console.log(`[generate] done user=${userId} images=${urls.length}`);
  return {
    content: [
      ...(revisedPrompt
        ? [{ type: "text" as const, text: `Revised prompt: ${revisedPrompt}` }]
        : []),
      ...urls.map((url) => ({ type: "text" as const, text: url })),
    ],
  };
}
