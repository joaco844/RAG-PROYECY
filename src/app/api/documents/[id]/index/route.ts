export const runtime = "nodejs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import pdfParse from "pdf-parse";

async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
      }),
    }
  );
  if (!res.ok) throw new Error(`Embed error: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

function chunkText(text: string, size = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const chunk = text.slice(start, start + size).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start += size - overlap;
  }
  return chunks;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await readFile(doc.filePath);
  let text = "";

  if (doc.mimeType === "application/pdf") {
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (doc.mimeType.startsWith("text/")) {
    text = buffer.toString("utf-8");
  } else {
    return NextResponse.json({ error: "Tipo de archivo no soportado para indexado" }, { status: 422 });
  }

  if (!text.trim()) return NextResponse.json({ error: "No se pudo extraer texto" }, { status: 422 });

  const chunks = chunkText(text);

  await prisma.chunk.deleteMany({ where: { documentId: id } });

  for (let i = 0; i < chunks.length; i++) {
    const values = await embedText(chunks[i]);
    const embeddingStr = `[${values.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO "Chunk" (id, content, "chunkIndex", embedding, "documentId", "createdAt")
      VALUES (gen_random_uuid()::text, ${chunks[i]}, ${i}, ${embeddingStr}::vector, ${id}, NOW())
    `;
  }

  return NextResponse.json({ indexed: chunks.length });
}
