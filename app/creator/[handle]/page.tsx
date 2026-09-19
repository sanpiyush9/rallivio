import type { Metadata } from "next";
import Link from "next/link";
import { getCreator } from "@/lib/server/discovery-pages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const { creator } = await getCreator(handle);
  return {
    title: `${creator.channel_title} — RALLIVIO Creator`,
    description: `Verified RALLIVIO discovery signals and recent YouTube observations for ${creator.channel_title}.`,
    openGraph: {
      title: `${creator.channel_title} — RALLIVIO Creator`,
      description: `Verified discovery signals for ${creator.channel_title}.`,
      images: [`/api/og?creator=${encodeURIComponent(creator.channel_title)}`],
    },
    twitter: { card: "summary_large_image", images: [`/api/og?creator=${encodeURIComponent(creator.channel_title)}`] },
  };
}

export default async function CreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { creator, videos, signalByVideo } = await getCreator(handle);
  return (
    <main style={{ minHeight: "100vh", background: "#08091b", color: "#f5f4fb", padding: "48px", fontFamily: "Arial, sans-serif" }}>
      <Link href="/" style={{ color: "#a86cff" }}>← Back to RALLIVIO</Link>
      <section style={{ maxWidth: 1100, margin: "40px auto" }}>
        <p style={{ color: "#70e4ad", fontWeight: 800, letterSpacing: 2 }}>CREATOR PROFILE</p>
        <h1 style={{ fontSize: "clamp(36px,6vw,72px)", lineHeight: 1 }}>{creator.channel_title}</h1>
        <p style={{ color: "#9da1bb" }}>YouTube creator · {creator.region} · {videos.length} observed videos</p>
        <div style={{ marginTop: 32, display: "grid", gap: 12 }}>
          {videos.map((video) => {
            const signal = signalByVideo.get(video.id);
            return <Link key={video.id} href={`/video/${video.id}`} style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 18, alignItems: "center", padding: 14, border: "1px solid #252847", borderRadius: 16, background: "#10132a", color: "inherit", textDecoration: "none" }}>
              <img src={video.thumbnail} alt="" style={{ width: 180, aspectRatio: "16/9", objectFit: "cover", borderRadius: 10 }} />
              <span><strong>{video.title}</strong><small style={{ display: "block", color: "#8f94ad", marginTop: 7 }}>{video.views.toLocaleString()} views · {new Date(video.published_at).toLocaleDateString()}</small></span>
              <b style={{ color: "#70e4ad" }}>{signal?.signal_type || "Observed"}</b>
            </Link>;
          })}
        </div>
      </section>
    </main>
  );
}
