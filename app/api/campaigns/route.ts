import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["youtube_video","youtube_channel","website","article","product","brand","social","music","app","link"]);

function normalizeUrl(value: string) {
  const url = new URL(value.trim());
  if (!["http:","https:"].includes(url.protocol)) throw new Error("Only http and https links can be promoted.");
  if (!url.hostname || url.hostname.length > 253) throw new Error("Enter a valid public content URL.");
  return url;
}

function classify(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.toLowerCase();
  if (host === "youtube.com" || host === "youtu.be") return path.includes("/channel/") || path.includes("/@") ? "youtube_channel" : "youtube_video";
  if (/instagram|tiktok|linkedin|facebook|x\.com|twitter/.test(host)) return "social";
  if (/spotify|soundcloud|music.apple/.test(host)) return "music";
  if (/product|shop|store/.test(path)) return "product";
  if (/blog|article|news/.test(path)) return "article";
  return "website";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, state: "AUTH_REQUIRED" }, { status: 401 });
    const body = await request.json() as { url?: string; type?: string; title?: string };
    if (!body.url) return NextResponse.json({ ok: false, state: "URL_REQUIRED" }, { status: 400 });
    let parsed: URL;
    try { parsed = normalizeUrl(body.url); } catch (error) {
      return NextResponse.json({ ok: false, state: error instanceof Error ? error.message : "INVALID_URL" }, { status: 400 });
    }
    const contentType = body.type && allowedTypes.has(body.type) ? body.type : classify(parsed);
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : null;
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data, error } = await supabase.from("promotion_campaigns").insert({
      user_id: user.id, source_url: parsed.toString(), source_host: parsed.hostname, content_type: contentType,
      title: title || parsed.hostname, status: "active", distribution_mode: "rallivio_owned",
      trial_started_at: trialStartedAt.toISOString(), trial_ends_at: trialEndsAt.toISOString(), started_at: trialStartedAt.toISOString(),
    }).select("id,source_url,source_host,content_type,title,status,distribution_mode,trial_ends_at,started_at").single();
    if (error) {
      console.error("promotion campaign create failed", error);
      return NextResponse.json({ ok: false, state: "CAMPAIGN_CREATE_FAILED" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, campaign: data });
  } catch (error) {
    console.error("promotion campaign request failed", error);
    return NextResponse.json({ ok: false, state: "CAMPAIGN_CREATE_FAILED" }, { status: 500 });
  }
}