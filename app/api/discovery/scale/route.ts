import { NextResponse } from "next/server";
import { sb } from "@/lib/server/youtube-discovery";

export async function GET() {
  const response = await sb("rpc/get_discovery_scale_status?p_target_videos=100000", {
    method: "POST",
  });

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, state: "SCALE_STATUS_FAILED" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, ...(await response.json()) });
}
