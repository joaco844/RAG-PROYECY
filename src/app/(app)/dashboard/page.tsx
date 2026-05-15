import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div
      style={{
        padding: "60px 40px",
      }}
    >
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "16px",
          letterSpacing: "0.96px",
        }}
      >
        Dashboard
      </h1>
      <p
        style={{
          fontSize: "13px",
          letterSpacing: "1.17px",
          color: "rgba(240, 240, 250, 0.5)",
        }}
      >
        Welcome, {session?.user?.name || session?.user?.email}
      </p>
    </div>
  );
}
