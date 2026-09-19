import type { Metadata } from "next";
import type { ReactNode } from "react";
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
      <body>{children}</body>
    </html>
  );
}
