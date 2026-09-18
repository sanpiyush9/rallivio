"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/living";
}

function getRequestOrigin(requestHeaders: Headers) {
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function oauthLogin(formData: FormData) {
  const provider = String(formData.get("provider") ?? "");
  if (provider !== "google") redirect("/login?error=Unsupported%20sign-in%20provider.");

  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        prompt: "select_account",
      },
      // Keep the Supabase redirect target exact. The callback itself defaults to /living.
      redirectTo: origin + "/auth/callback",
    },
  });

  if (error || !data.url) redirect("/login?error=" + encodeURIComponent(error?.message ?? "Unable to start social sign-in."));
  redirect(data.url);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) redirect("/login?error=Please%20enter%20your%20email%20and%20password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=" + encodeURIComponent(error.message));
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) redirect("/login?mode=signup&error=Please%20enter%20your%20email%20and%20password.");
  if (password.length < 8) redirect("/login?mode=signup&error=Password%20must%20be%20at%20least%208%20characters.");

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next),
      data: { display_name: displayName || email.split("@")[0] },
    },
  });

  if (error) redirect("/login?mode=signup&error=" + encodeURIComponent(error.message));
  if (data.session) redirect(next);
  redirect("/login?mode=signup&message=Check%20your%20email%20to%20confirm%20your%20RALLIVIO%20account.");
}

export async function forgotPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/login?mode=reset&error=Enter%20your%20email%20address%20first.");

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin + "/auth/reset-password",
  });

  if (error) redirect("/login?mode=reset&error=" + encodeURIComponent(error.message));
  redirect("/login?mode=reset&message=If%20an%20account%20exists%20for%20that%20email,%20we%20sent%20a%20password%20reset%20link.");
}
