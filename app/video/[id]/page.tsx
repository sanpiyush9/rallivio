import type { Metadata } from "next";
import Link from "next/link";
import { getVideo } from "@/lib/server/discovery-pages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { item, signal } = await getVideo(id);
  return {
    title: `${item.title} — RALLIVIO`,
    description: `${item.channel_title} · ${signal?.signal_type || "Verified source observation"} on RALLIVIO.`,
    openGraph: {
      title: item.title,
      description: `${item.channel_title} · ${signal?.signal_type || "Verified source observation"}`,
      images: [`/api/og?video=${encodeURIComponent(item.id)}`],
      type: "article",
    },
    twitter: { card: "summary_large_image", images: [`/api/og?video=${encodeURIComponent(item.id)}`] },
  };
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { item, signal } = await getVideo(id);
  return (
    <main style={{ minHeight: "100vh", background: "#08091b", color: "#f5f4fb", padding: "48px", fontFamily: "Arial, sans-serif" }}>
      <Link href="/" style={{ color: "#a86cff" }}>← Back to RALLIVIO</Link>
      <section style={{ maxWidth: 1100, margin: "40px auto" }}>
        <p style={{ color: "#70e4ad", fontWeight: 800, letterSpacing: 2 }}>VERIFIED VIDEO</p>
        <h1 style={{ fontSize: "clamp(32px,5vw,64px)", lineHeight: 1.05 }}>{item.title}</h1>
        <p style={{ color: "#a8abc2", fontSize: 20 }}>{item.channel_title} · {signal?.signal_type || "Observed source content"}</p>
        {item.embeddable && <div style={{ aspectRatio: "16 / 9", marginTop: 30 }}><iframe src={`https://www.youtube.com/embed/${item.id}`} title={item.title} style={{ width: "100%", height: "100%", border: 0, borderRadius: 20 }} allowFullScreen /></div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 24 }}>
          {[["Views", item.views], ["Likes", item.likes], ["Comments", item.comments], ["Momentum", signal?.momentum_score ?? "—"]].map(([label, value]) => <div key={String(label)} style={{ padding: 18, border: "1px solid #27294a", borderRadius: 14, background: "#10132a" }}><small style={{ color: "#858aa6" }}>{label}</small><strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>{typeof value === "number" ? value.toLocaleString() : value}</strong></div>)}
        </div>
        <p style={{ marginTop: 28, color: "#8f93ad", lineHeight: 1.6 }}>Observed by RALLIVIO at {new Date(item.stats_refreshed_at || item.acquired_at).toLocaleString()}.</p>
        <a href={item.url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, color: "#b77aff" }}>Watch on YouTube ↗</a>
      </section>
    </main>
  );
}
