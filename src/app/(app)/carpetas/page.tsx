import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CarpetasClient from "./CarpetasClient";

export default async function CarpetasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const carpetas = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true, createdAt: true, _count: { select: { documents: true } } },
  });

  const serialized = carpetas.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }));

  return <CarpetasClient initialCarpetas={serialized} />;
}
