import { NextResponse } from "next/server";
import { collectOpenWebSignals, type SensorCollectionResult } from "@/lib/server/world-sensors";
import type { DiscoverySourceItem } from "@/lib/server/source-adapters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 25) : 10;

  try {
    const signals: SensorCollectionResult[] = await collectOpenWebSignals(limit);
    const valid = signals.filter((item): item is DiscoverySourceItem => !("error" in item));
    const errors = signals.filter((item): item is { source: string; error: string } => "error" in item);

    return NextResponse.json({
      ok: true,
      observedAt: new Date().toISOString(),
      sources: ["wikipedia", "hackernews"],
      counts: {
        total: valid.length,
        wikipedia: valid.filter((item) => item.source === "wikipedia").length,
        hackernews: valid.filter((item) => item.source === "hackernews").length,
      },
      errors,
      signals: valid,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Sensor collection failed" },
      { status: 502 },
    );
  }
}
