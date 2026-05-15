"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Doc = {
  id: string;
  name: string;
  mimeType: string;
  createdAt: string;
  notes: string | null;
  projectId: string | null;
};

type Carpeta = { id: string; name: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DocumentViewClient({ doc: initialDoc, carpetas }: { doc: Doc; carpetas: Carpeta[] }) {
  const [doc, setDoc] = useState(initialDoc);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: doc.name, notes: doc.notes ?? "", projectId: doc.projectId ?? "" });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = searchParams.get("from") ?? "/documents";
  const backLabel = backHref.startsWith("/carpetas") ? "← Carpeta" : "← Documents";

  const isPdf = doc.mimeType === "application/pdf";
  const isImage = doc.mimeType.startsWith("image/");

  async function saveProps() {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, notes: form.notes, projectId: form.projectId }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setDoc((d) => ({ ...d, ...updated }));
      setModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteDoc() {
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    router.push("/documents");
  }

  return (
    <div style={{ height: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative" }}>

      <video autoPlay muted loop playsInline style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.5 }}>
        <source src="/nigth_sky_web.mp4" type="video/mp4" />
      </video>

      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: "1100px", height: "100%", border: "1px solid var(--ghost-border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid var(--ghost-border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link href={backHref} style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.4)", textDecoration: "none" }}>
              {backLabel}
            </Link>
            <div>
              <p style={{ fontSize: "13px", letterSpacing: "1.17px" }}>{doc.name}</p>
              <p style={{ fontSize: "11px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)", marginTop: "4px" }}>{formatDate(doc.createdAt)}</p>
            </div>
          </div>

          {/* Acciones */}
          <div style={{ position: "relative" }}>
            <button
              className="btn-ghost"
              style={{ borderRadius: "8px", padding: "10px 20px", fontSize: "11px" }}
              onClick={() => setMenuOpen((o) => !o)}
            >
              Acciones
            </button>

            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#111", border: "1px solid var(--ghost-border)", borderRadius: "6px", overflow: "hidden", zIndex: 10, minWidth: "160px" }}>
                {[
                  { label: "Propiedades", action: () => { setModal(true); setMenuOpen(false); } },
                  { label: "Eliminar", action: () => { setMenuOpen(false); deleteDoc(); } },
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

        {/* Viewer */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {isPdf && (
            <iframe src={`/api/documents/${doc.id}/file`} style={{ width: "100%", height: "100%", border: "none" }} />
          )}
          {isImage && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/documents/${doc.id}/file`} alt={doc.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          )}
          {!isPdf && !isImage && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)" }}>
                Vista previa no disponible para este tipo de archivo.
              </p>
              <a href={`/api/documents/${doc.id}/file`} download={doc.name} className="btn-ghost" style={{ borderRadius: "8px", padding: "14px 28px" }}>
                Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Properties modal */}
      {modal && (
        <div onClick={() => setModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#0a0a0a", border: "1px solid var(--ghost-border)", padding: "40px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "20px" }}>Propiedades</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.5)" }}>Nombre</label>
              <input className="input-ghost" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.5)" }}>Carpeta</label>
              <select className="input-ghost" value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} style={{ cursor: "pointer" }}>
                <option value="">Sin carpeta</option>
                {carpetas.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.5)" }}>Notas</label>
              <textarea className="input-ghost" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={4} style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-ghost" style={{ borderRadius: "8px", padding: "12px 24px", fontSize: "11px" }} onClick={() => setModal(false)}>Cancelar</button>
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
