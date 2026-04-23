import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getEnv } from "../env";

const OUTPUTS_DIR = process.env.OUTPUTS_DIR ?? "/data/outputs";

export async function saveImage(
  b64: string,
  format: "png" | "webp" | "jpeg",
): Promise<string> {
  await mkdir(OUTPUTS_DIR, { recursive: true });
  const filename = `${randomUUID()}.${format}`;
  await writeFile(path.join(OUTPUTS_DIR, filename), Buffer.from(b64, "base64"));
  const { APP_URL } = getEnv();
  return `${APP_URL}/outputs/${filename}`;
}
