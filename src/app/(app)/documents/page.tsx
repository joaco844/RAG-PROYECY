import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [documents, projects] = await Promise.all([
    prisma.document.findMany({
      where: { userId: session.user.id, projectId: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, notes: true, fileSize: true, mimeType: true, createdAt: true, projectId: true },
    }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = documents.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));

  return <DocumentsClient initialDocs={serialized} carpetas={projects} />;
}
