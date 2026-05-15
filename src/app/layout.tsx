import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG App",
  description: "Document management with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
