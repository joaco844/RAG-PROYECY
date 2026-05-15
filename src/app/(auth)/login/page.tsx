"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px", padding: "0 24px" }}>
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "48px",
          letterSpacing: "0.96px",
        }}
      >
        Sign In
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "12px", letterSpacing: "1.17px" }}>
            Email
          </label>
          <input
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            className="input-ghost"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "12px", letterSpacing: "1.17px" }}>
            Password
          </label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="input-ghost"
          />
        </div>

        {error && (
          <p className="text-error">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-ghost"
          style={{ marginTop: "16px", width: "100%" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p
        style={{
          marginTop: "32px",
          fontSize: "12px",
          letterSpacing: "1px",
          color: "rgba(240, 240, 250, 0.5)",
          textAlign: "center",
        }}
      >
        No account?{" "}
        <Link
          href="/register"
          style={{ color: "var(--spectral-white)", textDecoration: "underline" }}
        >
          Register
        </Link>
      </p>
    </div>
  );
}
