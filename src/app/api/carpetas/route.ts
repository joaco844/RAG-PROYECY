import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const carpetas = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true, createdAt: true, _count: { select: { documents: true } } },
  });

  return NextResponse.json(carpetas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const carpeta = await prisma.project.create({
    data: { name: name.trim(), description: description?.trim() || null, userId: session.user.id },
    select: { id: true, name: true, description: true, createdAt: true, _count: { select: { documents: true } } },
  });

  return NextResponse.json(carpeta, { status: 201 });
}
