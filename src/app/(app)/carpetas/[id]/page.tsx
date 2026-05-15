import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CarpetaViewClient from "./CarpetaViewClient";

export default async function CarpetaViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const carpeta = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, notes: true, createdAt: true, userId: true },
  });

  if (!carpeta || carpeta.userId !== session.user.id) redirect("/carpetas");

  const documents = await prisma.document.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, mimeType: true, createdAt: true, _count: { select: { chunks: true } } },
  });

  return (
    <CarpetaViewClient
      carpeta={{ ...carpeta, createdAt: carpeta.createdAt.toISOString() }}
      initialDocs={documents.map((d) => ({ ...d, createdAt: d.createdAt.toISOString(), chunkCount: d._count.chunks }))}
    />
  );
}
