import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/living";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) return NextResponse.redirect(new URL("/login?error=The%20confirmation%20link%20is%20invalid%20or%20expired.", url.origin));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=This%20confirmation%20link%20is%20invalid%20or%20expired.", url.origin));

  return NextResponse.redirect(new URL(next, url.origin));
}
