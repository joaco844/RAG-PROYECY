import { auth } from "@/auth";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Documents", href: "/documents" },
  { label: "Carpetas", href: "/carpetas" },
];

export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name || session?.user?.email || "";

  return (
    <div
      style={{
        position: "relative",
        height: "calc(100vh - 80px)",
        overflow: "hidden",
      }}
    >
      {/* Night sky — full background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          opacity: 0.5,
          pointerEvents: "none",
        }}
      >
        <source src="/nigth_sky_web.mp4" type="video/mp4" />
      </video>

      {/* Mars — right side */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          width: "45%",
          objectFit: "cover",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <source src="/mars_web.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.1) 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          padding: "60px 40px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <h1 style={{ fontSize: "48px" }}>Dashboard</h1>
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "1.17px",
            color: "rgba(240,240,250,0.5)",
            marginBottom: "40px",
          }}
        >
          Welcome, {name}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="btn-ghost"
              style={{
                width: "260px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {item.label}
              <span style={{ letterSpacing: 0 }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
