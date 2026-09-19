import { NextResponse } from "next/server";

type IntelligenceKind = "creator" | "topic" | "region";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabase(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase server configuration is missing");
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

function limitFor(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("limit") ?? "25");
  return Number.isFinite(raw) ? Math.min(100, Math.max(1, Math.floor(raw))) : 25;
}

function kindFor(request: Request): IntelligenceKind {
  const kind = new URL(request.url).searchParams.get("kind");
  return kind === "topic" || kind === "region" ? kind : "creator";
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, state: "CONFIGURATION_REQUIRED" }, { status: 503 });
  }

  try {
    const kind = kindFor(request);
    const limit = limitFor(request);

    const table = {
      creator: "discovery_creator_intelligence",
      topic: "discovery_topic_intelligence",
      region: "discovery_region_intelligence",
    }[kind];

    const order = kind === "creator"
      ? "anomaly_score.desc,momentum_score.desc"
      : "anomaly_score.desc,current_velocity.desc";

    const response = await supabase(
      `${table}?select=*&order=${encodeURIComponent(order)}&limit=${limit}`,
    );

    if (!response.ok) {
      return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
    }

    const items = await response.json();

    return NextResponse.json(
      {
        ok: true,
        kind,
        generatedAt: new Date().toISOString(),
        items,
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (error) {
    console.error("intelligence read failed", error);
    return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
  }
}
