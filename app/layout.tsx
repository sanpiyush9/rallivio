import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

const description =
  "Real-time creator discovery across platforms. Verified signals, transparent evidence, fair surfacing for emerging creators.";

export const metadata: Metadata = {
  title: "RALLIVIO — See what's moving",
  description,
  openGraph: {
    title: "RALLIVIO — See what's moving",
    description,
    images: ["/api/og"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RALLIVIO — See what's moving",
    description,
    images: ["/api/og"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Link href="/pricing" aria-label="View RALLIVIO Pro plans" style={{
          position: "fixed", right: 18, bottom: 18, zIndex: 1000,
          padding: "10px 15px", borderRadius: 999, background: "#8d4dff",
          color: "#fff", textDecoration: "none", fontSize: 10, fontWeight: 900,
          letterSpacing: ".4px", boxShadow: "0 10px 35px #0008"
        }}>RALLIVIO PRO</Link>
      </body>
    </html>
  );
}
