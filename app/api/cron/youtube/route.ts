import { NextRequest, NextResponse } from "next/server";
import { runYouTubeAcquisition } from "@/features/discovery/acquisition/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runYouTubeAcquisition());
  } catch (error) {
    console.error("youtube_acquisition_failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown acquisition error" }, { status: 503 });
  }
}
