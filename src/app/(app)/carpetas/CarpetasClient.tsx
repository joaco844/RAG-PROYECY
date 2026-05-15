"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Carpeta = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { documents: number };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CarpetasClient({ initialCarpetas }: { initialCarpetas: Carpeta[] }) {
  const [carpetas, setCarpetas] = useState(initialCarpetas);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<Carpeta | "new" | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filtered = carpetas.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  function openNew() {
    setForm({ name: "", description: "" });
    setModal("new");
  }

  function openProps(c: Carpeta) {
    setForm({ name: c.name, description: c.description ?? "" });
    setModal(c);
    setOpenMenu(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (modal === "new") {
        const res = await fetch("/api/carpetas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
        const created = await res.json();
        setCarpetas((prev) => [created, ...prev]);
      } else if (modal) {
        const res = await fetch(`/api/carpetas/${modal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Error al guardar");
        const updated = await res.json();
        setCarpetas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
      setModal(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCarpeta(id: string) {
    setOpenMenu(null);
    if (!confirm("¿Eliminar esta carpeta y todos sus documentos?")) return;
    await fetch(`/api/carpetas/${id}`, { method: "DELETE" });
    setCarpetas((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 80px)", padding: "40px" }}>

      <video autoPlay muted loop playsInline style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.5 }}>
        <source src="/nigth_sky_web.mp4" type="video/mp4" />
      </video>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <Link href="/dashboard" style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.4)", textDecoration: "none", display: "inline-block", marginBottom: "12px" }}>← Dashboard</Link>
            <h1 style={{ fontSize: "48px" }}>Carpetas</h1>
          </div>
          <button className="btn-ghost" style={{ borderRadius: "8px", padding: "14px 28px" }} onClick={openNew}>
            Nuevo
          </button>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          <input className="input-ghost" type="text" placeholder="Buscar carpeta…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
          <button className="btn-ghost" style={{ borderRadius: "8px", padding: "14px 18px", fontSize: "16px" }} onClick={() => setSearch("")}>✕</button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <p style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)" }}>
            {search ? "Sin resultados." : "No hay carpetas aún."}
          </p>
        ) : (
          <div>
            {filtered.map((c, i) => (
              <div
                key={c.id}
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 0", borderTop: i === 0 ? "1px solid var(--ghost-border)" : undefined, borderBottom: "1px solid var(--ghost-border)", position: "relative" }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", letterSpacing: "1.17px" }}>{c.name}</p>
                  {c.description && (
                    <p style={{ fontSize: "11px", letterSpacing: "1px", color: "rgba(240,240,250,0.6)", marginTop: "4px" }}>{c.description}</p>
                  )}
                  <p style={{ fontSize: "11px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)", marginTop: "4px" }}>{formatDate(c.createdAt)}</p>
                </div>

                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                    style={{ background: "none", border: "1px solid var(--ghost-border)", color: "var(--spectral-white)", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", letterSpacing: "2px" }}
                  >
                    •••
                  </button>

                  {openMenu === c.id && (
                    <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#111", border: "1px solid var(--ghost-border)", borderRadius: "6px", overflow: "hidden", zIndex: 10, minWidth: "160px" }}>
                      {[
                        { label: "Ver", action: () => router.push(`/carpetas/${c.id}`) },
                        { label: "Propiedades", action: () => openProps(c) },
                        { label: "Eliminar", action: () => deleteCarpeta(c.id) },
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

      {/* Modal nueva / propiedades */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#0a0a0a", border: "1px solid var(--ghost-border)", padding: "40px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "20px" }}>{modal === "new" ? "Nueva carpeta" : "Propiedades"}</h2>

            {error && <p className="text-error">{error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.5)" }}>Nombre</label>
              <input className="input-ghost" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.5)" }}>Descripción</label>
              <textarea className="input-ghost" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-ghost" style={{ borderRadius: "8px", padding: "12px 24px", fontSize: "11px" }} onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-ghost" style={{ borderRadius: "8px", padding: "12px 24px", fontSize: "11px" }} onClick={save} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
