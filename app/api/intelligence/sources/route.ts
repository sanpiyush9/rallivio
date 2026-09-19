import { NextResponse } from "next/server";
import { sb } from "@/lib/server/youtube-discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await sb(
      "discovery_source_registry?select=source_id,display_name,source_kind,enabled,official_api,attribution_url,notes&order=source_id.asc",
    );
    if (!response.ok) return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
    return NextResponse.json({ ok: true, sources: await response.json() }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
  }
}