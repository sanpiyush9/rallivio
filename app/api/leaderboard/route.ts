import { NextResponse } from "next/server";
import { getPhase0Leaderboard } from "@/features/discovery/serving/leaderboard";

export async function GET() {
  try {
    return NextResponse.json(await getPhase0Leaderboard());
  } catch (error) {
    return NextResponse.json({ ready: false, error: error instanceof Error ? error.message : "Unknown data error" }, { status: 503 });
  }
}
