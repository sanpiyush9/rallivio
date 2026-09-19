import { NextResponse } from "next/server";
import { explainSignal } from "@/lib/server/explanations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || !body.evidence) {
      return NextResponse.json(
        { ok: false, state: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      explanation: explainSignal({
        title: typeof body.title === "string" ? body.title : null,
        creator: typeof body.creator === "string" ? body.creator : null,
        topic: typeof body.topic === "string" ? body.topic : null,
        evidence: body.evidence,
      }),
    });
  } catch {
    return NextResponse.json(
      { ok: false, state: "INVALID_REQUEST" },
      { status: 400 },
    );
  }
}
