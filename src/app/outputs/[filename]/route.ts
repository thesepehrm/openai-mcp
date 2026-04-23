import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const OUTPUTS_DIR = process.env.OUTPUTS_DIR ?? "/data/outputs";

const MIME: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!/^[\w-]+\.(png|webp|jpeg|jpg)$/.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = filename.split(".").pop()!;
  const filePath = path.join(OUTPUTS_DIR, filename);

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: { "Content-Type": MIME[ext] ?? "application/octet-stream" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
