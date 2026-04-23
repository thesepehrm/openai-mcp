import { z } from "zod";
import type { ImagesResponse } from "openai/resources/images.js";
import { toFile } from "openai";
import { getOpenAIClient } from "../openai";
import { saveImage } from "../save-image";

export const editImageInputSchema = {
  prompt: z
    .string()
    .min(1)
    .max(32000)
    .describe("Description of the desired edits"),
  image: z.string().min(1).describe("Base64-encoded image (PNG/WebP/JPEG)"),
  mask: z
    .string()
    .optional()
    .describe(
      "Base64-encoded PNG mask — transparent pixels mark the edit area",
    ),
  size: z
    .enum(["auto", "1024x1024", "1536x1024", "1024x1536"])
    .optional()
    .default("auto")
    .describe("Output dimensions"),
  output_format: z
    .enum(["png", "webp", "jpeg"])
    .optional()
    .default("png")
    .describe("Output file format"),
  quality: z
    .enum(["low", "medium", "high"])
    .optional()
    .default("low")
    .describe("Generation quality"),
  n: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .default(1)
    .describe("Number of variants"),
};

export type EditImageInput = {
  prompt: string;
  image: string;
  mask?: string;
  size?: "auto" | "1024x1024" | "1536x1024" | "1024x1536";
  output_format?: "png" | "webp" | "jpeg";
  quality?: "low" | "medium" | "high";
  n?: number;
};

export async function editImage(userId: string, input: EditImageInput) {
  const client = getOpenAIClient(userId);

  const imageFile = await toFile(
    Buffer.from(input.image, "base64"),
    "image.png",
    {
      type: "image/png",
    },
  );

  const params: Parameters<typeof client.images.edit>[0] = {
    model: "gpt-image-2",
    image: imageFile,
    prompt: input.prompt,
    n: input.n ?? 1,
    size: input.size === "auto" || !input.size ? undefined : input.size,
  };

  if (input.mask) {
    params.mask = await toFile(Buffer.from(input.mask, "base64"), "mask.png", {
      type: "image/png",
    });
  }

  console.log(
    `[edit] user=${userId} prompt="${input.prompt.slice(0, 80)}" n=${input.n ?? 1}`,
  );
  const response = (await client.images.edit(params)) as ImagesResponse;

  const format = input.output_format ?? "png";
  const urls = await Promise.all(
    (response.data ?? []).map((img) => saveImage(img.b64_json ?? "", format)),
  );

  console.log(`[edit] done user=${userId} images=${urls.length}`);
  return {
    content: urls.map((url) => ({ type: "text" as const, text: url })),
  };
}
