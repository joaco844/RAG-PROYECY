"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Document = {
  id: string;
  name: string;
  notes: string | null;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  projectId: string | null;
};

type Carpeta = { id: string; name: string };

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return "fi fi-rr-file-pdf";
  if (mimeType.includes("word")) return "fi fi-rr-file-word";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "fi fi-rr-file-spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "fi fi-rr-file-powerpoint";
  if (mimeType.startsWith("image/")) return "fi fi-rr-file-image";
  if (mimeType.startsWith("text/")) return "fi fi-rr-file";
  return "fi fi-rr-file";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DocumentsClient({
  initialDocs,
  carpetas,
}: {
  initialDocs: Document[];
  carpetas: Carpeta[];
}) {
  const [docs, setDocs] = useState(initialDocs);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<Document | null>(null);
  const [form, setForm] = useState({ name: "", notes: "", projectId: "" });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (!res.ok) throw new Error("Error al subir el archivo");
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function openProps(doc: Document) {
    setModal(doc);
    setForm({ name: doc.name, notes: doc.notes ?? "", projectId: doc.projectId ?? "" });
    setOpenMenu(null);
  }

  async function saveProps() {
    if (!modal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${modal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, notes: form.notes, projectId: form.projectId }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const updated = await res.json();
      if (updated.projectId) {
        setDocs((prev) => prev.filter((d) => d.id !== updated.id));
      } else {
        setDocs((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
      }
      setModal(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDoc(id: string) {
    setOpenMenu(null);
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Error al eliminar");
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 80px)", padding: "40px" }}>

      {/* Background video */}
      <video autoPlay muted loop playsInline style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.5 }}>
        <source src="/nigth_sky_web.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <Link href="/dashboard" style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.4)", textDecoration: "none", display: "inline-block", marginBottom: "12px" }}>← Dashboard</Link>
            <h1 style={{ fontSize: "48px" }}>Documents</h1>
          </div>
          <button className="btn-ghost" style={{ borderRadius: "8px", padding: "14px 28px" }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Subiendo…" : "Agregar"}
          </button>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          <input className="input-ghost" type="text" placeholder="Buscar documento…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
          <button className="btn-ghost" style={{ borderRadius: "8px", padding: "14px 18px", fontSize: "16px" }} onClick={() => setSearch("")}>✕</button>
        </div>

        {error && <p className="text-error" style={{ marginBottom: "16px" }}>{error}</p>}

        {/* List */}
        {filtered.length === 0 ? (
          <p style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)" }}>
            {search ? "Sin resultados." : "No hay documentos aún."}
          </p>
        ) : (
          <div>
            {filtered.map((doc, i) => (
              <div
                key={doc.id}
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 0", borderTop: i === 0 ? "1px solid var(--ghost-border)" : undefined, borderBottom: "1px solid var(--ghost-border)", position: "relative" }}
              >
                {/* File type icon */}
                <i className={fileIcon(doc.mimeType)} style={{ fontSize: "24px", color: "rgba(240,240,250,0.7)", flexShrink: 0 }} />

                {/* Name + date */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", letterSpacing: "1.17px" }}>{doc.name}</p>
                  <p style={{ fontSize: "11px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)", marginTop: "4px" }}>{formatDate(doc.createdAt)}</p>
                </div>

                {/* Menu button */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                    style={{ background: "none", border: "1px solid var(--ghost-border)", color: "var(--spectral-white)", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", letterSpacing: "2px" }}
                  >
                    •••
                  </button>

                  {openMenu === doc.id && (
                    <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#111", border: "1px solid var(--ghost-border)", borderRadius: "6px", overflow: "hidden", zIndex: 10, minWidth: "160px" }}>
                      {[
                        { label: "Ver", action: () => router.push(`/documents/${doc.id}`) },
                        { label: "Propiedades", action: () => openProps(doc) },
                        { label: "Eliminar", action: () => deleteDoc(doc.id) },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--ghost-border)", color: "var(--spectral-white)", padding: "12px 16px", cursor: "pointer", fontSize: "11px", letterSpacing: "1.17px", fontFamily: "var(--font-display)", textTransform: "uppercase" }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Properties modal */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0a0a0a", border: "1px solid var(--ghost-border)", padding: "40px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <h2 style={{ fontSize: "20px" }}>Propiedades</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.5)" }}>Nombre</label>
              <input className="input-ghost" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.5)" }}>Carpeta</label>
              <select
                className="input-ghost"
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                style={{ cursor: "pointer" }}
              >
                <option value="">Sin carpeta</option>
                {carpetas.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.5)" }}>Notas</label>
              <textarea
                className="input-ghost"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={4}
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-ghost" style={{ borderRadius: "8px", padding: "12px 24px", fontSize: "11px" }} onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-ghost" style={{ borderRadius: "8px", padding: "12px 24px", fontSize: "11px" }} onClick={saveProps} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
