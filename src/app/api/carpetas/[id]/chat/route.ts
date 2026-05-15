import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: carpetaId } = await params;
  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "No question" }, { status: 400 });

  const carpeta = await prisma.project.findUnique({ where: { id: carpetaId } });
  if (!carpeta || carpeta.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const values = await embedText(question);
  const embeddingStr = `[${values.join(",")}]`;

  const chunks = await prisma.$queryRaw<{ content: string }[]>`
    SELECT c.content
    FROM "Chunk" c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE d."projectId" = ${carpetaId}
    ORDER BY c.embedding <=> ${embeddingStr}::vector
    LIMIT 5
  `;

  if (chunks.length === 0)
    return NextResponse.json({ answer: "No encontré documentos indexados en esta carpeta para responder tu pregunta." });

  const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");
  const prompt = `Sos un asistente que responde preguntas basándose exclusivamente en los fragmentos de documentos provistos. Si la respuesta no está en los fragmentos, decilo claramente.

FRAGMENTOS:
${context}

PREGUNTA: ${question}

RESPUESTA:`;

  const genResult = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return NextResponse.json({ answer: genResult.text });
}
