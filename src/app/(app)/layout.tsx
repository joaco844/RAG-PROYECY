import { auth } from "@/auth";
import { signOut } from "@/auth";
import NavLinks from "./NavLinks";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: "1px solid var(--ghost-border)",
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "1.17px",
          }}
        >
          RAG
        </span>

        <NavLinks />

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <span style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(240,240,250,0.5)" }}>
            {session?.user?.email}
          </span>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="btn-ghost" style={{ padding: "10px 20px", fontSize: "11px" }}>
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      <main style={{ paddingTop: "80px" }}>{children}</main>
    </div>
  );
}
