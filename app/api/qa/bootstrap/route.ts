import { NextResponse } from "next/server";

const QA_TOKEN = "dBiCMzTb7mWN9KSdEI65Bd0aEcgfq1EC";

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false, state: "NOT_AVAILABLE" }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("token") !== QA_TOKEN) {
    return NextResponse.json({ ok: false, state: "NOT_AVAILABLE" }, { status: 404 });
  }

  const response = await fetch(new URL("/api/discovery", request.url), {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
    cache: "no-store",
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
