import type { Metadata } from "next";
import Link from "next/link";
import { getTopic } from "@/lib/server/discovery-pages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { topic } = await getTopic(slug);
  return {
    title: `${topic.label} — RALLIVIO Trending`,
    description: `Current verified YouTube observations and RALLIVIO signals for ${topic.label}.`,
    openGraph: {
      title: `${topic.label} — RALLIVIO Trending`,
      description: `Current verified discovery signals in ${topic.label}.`,
      images: [`/api/og?topic=${encodeURIComponent(topic.label)}`],
    },
    twitter: { card: "summary_large_image", images: [`/api/og?topic=${encodeURIComponent(topic.label)}`] },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { topic, rows, signalByVideo } = await getTopic(slug);
  return (
    <main style={{ minHeight: "100vh", background: "#08091b", color: "#f5f4fb", padding: "48px", fontFamily: "Arial, sans-serif" }}>
      <Link href="/" style={{ color: "#a86cff" }}>← Back to RALLIVIO</Link>
      <section style={{ maxWidth: 1200, margin: "40px auto" }}>
        <p style={{ color: "#70e4ad", fontWeight: 800, letterSpacing: 2 }}>TRENDING TOPIC</p>
        <h1 style={{ fontSize: "clamp(36px,6vw,72px)", lineHeight: 1 }}>{topic.label}</h1>
        <p style={{ color: "#9da1bb" }}>{rows.length} persisted source observations · signals shown only where RALLIVIO has measured evidence.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginTop: 32 }}>
          {rows.map((video) => {
            const signal = signalByVideo.get(video.id);
            return <Link key={video.id} href={`/video/${video.id}`} style={{ color: "inherit", textDecoration: "none", border: "1px solid #252847", borderRadius: 16, overflow: "hidden", background: "#10132a" }}>
              <img src={video.thumbnail} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
              <div style={{ padding: 14 }}>
                <strong style={{ display: "block", lineHeight: 1.35 }}>{video.title}</strong>
                <small style={{ display: "block", color: "#8f94ad", marginTop: 7 }}>{video.channel_title} · {video.views.toLocaleString()} views</small>
                <b style={{ display: "block", color: "#70e4ad", marginTop: 10 }}>{signal?.signal_type || "Observed"}</b>
              </div>
            </Link>;
          })}
        </div>
      </section>
    </main>
  );
}
