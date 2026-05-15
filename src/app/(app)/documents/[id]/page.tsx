import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DocumentViewClient from "./DocumentViewClient";

export default async function DocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true, name: true, mimeType: true, userId: true, createdAt: true, notes: true, projectId: true },
  });

  if (!doc || doc.userId !== session.user.id) redirect("/documents");

  const carpetas = await prisma.project.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <Suspense>
      <DocumentViewClient
        doc={{ ...doc, createdAt: doc.createdAt.toISOString() }}
        carpetas={carpetas}
      />
    </Suspense>
  );
}
