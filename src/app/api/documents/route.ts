import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id, projectId: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, fileSize: true, mimeType: true, createdAt: true },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, buffer);

  const document = await prisma.document.create({
    data: {
      name: file.name,
      type: "OTHER",
      filePath: filePath,
      fileSize: file.size,
      mimeType: file.type,
      userId: session.user.id,
    },
    select: { id: true, name: true, fileSize: true, mimeType: true, createdAt: true },
  });

  return NextResponse.json(document, { status: 201 });
}
