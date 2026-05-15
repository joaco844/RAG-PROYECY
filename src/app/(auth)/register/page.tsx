"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      router.push("/login");
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
        Register
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "12px", letterSpacing: "1.17px" }}>
            Name
          </label>
          <input
            name="name"
            type="text"
            placeholder="Your name"
            required
            className="input-ghost"
          />
        </div>

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
            minLength={8}
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
          {loading ? "Creating account..." : "Create Account"}
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
        Already have an account?{" "}
        <Link
          href="/login"
          style={{ color: "var(--spectral-white)", textDecoration: "underline" }}
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
