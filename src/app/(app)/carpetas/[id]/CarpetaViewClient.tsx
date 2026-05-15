"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type Carpeta = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
};

type Doc = { id: string; name: string; mimeType: string; createdAt: string };

type Tab = "notas" | "documentos" | "chat";

type ChatMessage = { role: "user" | "assistant"; content: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return "fi fi-rr-file-pdf";
  if (mimeType.includes("word")) return "fi fi-rr-file-word";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "fi fi-rr-file-spreadsheet";
  if (mimeType.startsWith("image/")) return "fi fi-rr-file-image";
  return "fi fi-rr-file";
}

export default function CarpetaViewClient({ carpeta: initial, initialDocs }: { carpeta: Carpeta; initialDocs: Doc[] }) {
  const [carpeta, setCarpeta] = useState(initial);
  const [docs, setDocs] = useState(initialDocs);
  const [tab, setTab] = useState<Tab>("notas");
  const [notesMode, setNotesMode] = useState<"edit" | "preview">("edit");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [indexingDoc, setIndexingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  async function sendMessage() {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/carpetas/${carpeta.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error al procesar la consulta." }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", carpeta.id);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function desasociar(docId: string) {
    setOpenMenu(null);
    await fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "" }),
    });
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  async function indexDoc(docId: string) {
    setOpenMenu(null);
    setIndexingDoc(docId);
    try {
      await fetch(`/api/documents/${docId}/index`, { method: "POST" });
    } finally {
      setIndexingDoc(null);
    }
  }

  async function deleteDoc(docId: string) {
    setOpenMenu(null);
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/carpetas/${carpeta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setCarpeta((c) => ({ ...c, notes: updated.notes }));
    } finally {
      setSavingNotes(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "notas", label: "Notas" },
    { key: "documentos", label: "Documentos" },
    { key: "chat", label: "Chat" },
  ];

  return (
    <div style={{ height: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px", position: "relative" }}>

      <video autoPlay muted loop playsInline style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "50%", height: "auto", zIndex: 0, opacity: 0.6 }}>
        <source src="/earth.mp4" type="video/mp4" />
      </video>

      {/* Aside card */}
      <div style={{ position: "relative", zIndex: 1, width: "180px", flexShrink: 0, height: "100%", border: "1px solid var(--ghost-border)", padding: "28px 16px", display: "flex", flexDirection: "column", gap: "12px", background: "rgba(0,0,0,0.6)" }}>
        <Link href="/carpetas" style={{ fontSize: "11px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.4)", textDecoration: "none", marginBottom: "12px", display: "block" }}>
          ← Carpetas
        </Link>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn-ghost"
            style={{
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "11px",
              textAlign: "left",
              opacity: tab === t.key ? 1 : 0.5,
              borderColor: tab === t.key ? "var(--spectral-white)" : "var(--ghost-border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main card */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, height: "100%", border: "1px solid var(--ghost-border)", display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--ghost-border)", flexShrink: 0 }}>
          <h2 style={{ fontSize: "24px", letterSpacing: "0.96px" }}>{carpeta.name}</h2>
          {carpeta.description && (
            <p style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(240,240,250,0.5)", marginTop: "6px" }}>{carpeta.description}</p>
          )}
          <p style={{ fontSize: "11px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)", marginTop: "6px" }}>{formatDate(carpeta.createdAt)}</p>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px" }}>

          {tab === "notas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["edit", "preview"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setNotesMode(m)}
                    style={{ background: "none", border: "none", color: notesMode === m ? "var(--spectral-white)" : "rgba(240,240,250,0.4)", fontSize: "11px", letterSpacing: "1.17px", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-display)", paddingBottom: "4px", borderBottom: notesMode === m ? "1px solid var(--spectral-white)" : "none" }}
                  >
                    {m === "edit" ? "Editar" : "Preview"}
                  </button>
                ))}
              </div>

              {notesMode === "edit" ? (
                <textarea
                  className="input-ghost"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribí tus notas en markdown…"
                  style={{ flex: 1, resize: "none", minHeight: "300px", fontFamily: "monospace" }}
                />
              ) : (
                <div style={{ flex: 1, minHeight: "300px", overflowY: "auto" }}>
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 style={{ fontSize: "28px", letterSpacing: "0.96px", marginBottom: "16px", marginTop: "24px" }}>{children}</h1>,
                      h2: ({ children }) => <h2 style={{ fontSize: "20px", letterSpacing: "0.96px", marginBottom: "12px", marginTop: "20px" }}>{children}</h2>,
                      h3: ({ children }) => <h3 style={{ fontSize: "15px", letterSpacing: "0.96px", marginBottom: "8px", marginTop: "16px" }}>{children}</h3>,
                      p: ({ children }) => <p style={{ fontSize: "13px", lineHeight: "1.7", marginBottom: "12px", textTransform: "none", letterSpacing: "normal", color: "rgba(240,240,250,0.85)" }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ paddingLeft: "20px", marginBottom: "12px" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ fontSize: "13px", lineHeight: "1.7", textTransform: "none", letterSpacing: "normal", color: "rgba(240,240,250,0.85)", marginBottom: "4px" }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ fontWeight: 700, color: "var(--spectral-white)" }}>{children}</strong>,
                      em: ({ children }) => <em style={{ fontStyle: "italic", color: "rgba(240,240,250,0.7)" }}>{children}</em>,
                      code: ({ children }) => <code style={{ background: "rgba(240,240,250,0.1)", padding: "2px 6px", fontSize: "12px", fontFamily: "monospace", borderRadius: "3px" }}>{children}</code>,
                      hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--ghost-border)", margin: "20px 0" }} />,
                    }}
                  >
                    {notes || "*Sin notas aún.*"}
                  </ReactMarkdown>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-ghost" style={{ borderRadius: "8px", padding: "12px 24px", fontSize: "11px" }} onClick={saveNotes} disabled={savingNotes}>
                  {savingNotes ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {tab === "documentos" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                <button className="btn-ghost" style={{ borderRadius: "8px", padding: "10px 20px", fontSize: "11px" }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? "Subiendo…" : "Agregar"}
                </button>
                <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
              </div>

              {docs.length === 0 ? (
                <p style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)" }}>No hay documentos en esta carpeta.</p>
              ) : (
                docs.map((doc, i) => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 0", borderTop: i === 0 ? "1px solid var(--ghost-border)" : undefined, borderBottom: "1px solid var(--ghost-border)" }}>
                    <i className={fileIcon(doc.mimeType)} style={{ fontSize: "20px", color: "rgba(240,240,250,0.7)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", letterSpacing: "1.17px" }}>{doc.name}</p>
                      <p style={{ fontSize: "11px", letterSpacing: "1px", color: "rgba(240,240,250,0.4)", marginTop: "4px" }}>{formatDate(doc.createdAt)}</p>
                    </div>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                        style={{ background: "none", border: "1px solid var(--ghost-border)", color: "var(--spectral-white)", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", letterSpacing: "2px" }}
                      >
                        •••
                      </button>
                      {openMenu === doc.id && (
                        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#111", border: "1px solid var(--ghost-border)", borderRadius: "6px", overflow: "hidden", zIndex: 10, minWidth: "160px" }}>
                          {[
                            { label: "Ver", action: () => router.push(`/documents/${doc.id}?from=/carpetas/${carpeta.id}`) },
                            { label: indexingDoc === doc.id ? "Indexando…" : "Indexar", action: () => indexDoc(doc.id), disabled: indexingDoc === doc.id },
                            { label: "Desasociar", action: () => desasociar(doc.id) },
                            { label: "Eliminar", action: () => deleteDoc(doc.id) },
                          ].map((item) => (
                            <button key={item.label} onClick={item.action} disabled={"disabled" in item && item.disabled} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--ghost-border)", color: "var(--spectral-white)", padding: "12px 16px", cursor: "pointer", fontSize: "11px", letterSpacing: "1.17px", fontFamily: "var(--font-display)", textTransform: "uppercase", opacity: "disabled" in item && item.disabled ? 0.5 : 1 }}>
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0" }}>

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "8px" }}>
                {messages.length === 0 && !chatLoading && (
                  <p style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(240,240,250,0.3)", textAlign: "center", marginTop: "48px" }}>
                    Hacé una pregunta sobre los documentos de esta carpeta.
                  </p>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "10px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.35)", fontFamily: "var(--font-display)" }}>
                      {msg.role === "user" ? "VOS" : "IA"}
                    </span>
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "14px 18px",
                        border: "1px solid",
                        borderColor: msg.role === "user" ? "rgba(240,240,250,0.25)" : "rgba(240,240,250,0.12)",
                        background: msg.role === "user" ? "rgba(240,240,250,0.06)" : "transparent",
                      }}
                    >
                      <p style={{ fontSize: "13px", lineHeight: "1.7", color: msg.role === "user" ? "var(--spectral-white)" : "rgba(240,240,250,0.85)", textTransform: "none", letterSpacing: "normal", margin: 0, whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                    <span style={{ fontSize: "10px", letterSpacing: "1.17px", color: "rgba(240,240,250,0.35)", fontFamily: "var(--font-display)" }}>IA</span>
                    <div style={{ padding: "14px 18px", border: "1px solid rgba(240,240,250,0.12)" }}>
                      <span style={{ fontSize: "13px", color: "rgba(240,240,250,0.4)", letterSpacing: "1px" }}>●●●</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input row */}
              <div style={{ borderTop: "1px solid var(--ghost-border)", paddingTop: "20px", display: "flex", gap: "12px", alignItems: "flex-end", flexShrink: 0 }}>
                <textarea
                  className="input-ghost"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Preguntá sobre los documentos…"
                  rows={2}
                  style={{ flex: 1, resize: "none", fontSize: "13px", lineHeight: "1.6", fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: "normal" }}
                  disabled={chatLoading}
                />
                <button
                  className="btn-ghost"
                  onClick={sendMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ borderRadius: "8px", padding: "12px 20px", fontSize: "11px", flexShrink: 0, alignSelf: "stretch", opacity: chatLoading || !chatInput.trim() ? 0.4 : 1 }}
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
