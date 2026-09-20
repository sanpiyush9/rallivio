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
  const next = safeNextPath(String(formData.get("next") ?? ""));

  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        prompt: "select_account",
      },
      // Preserve the requested destination through the OAuth callback.
      // Keep the callback on the same host that initiated sign-in so the
      // Supabase session cookie is returned to the correct RALLIVIO deployment.
      redirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next),
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

  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next),
      data: { display_name: displayName || email.split("@")[0] },
    },
  });

  if (error) {
    const normalizedError = error.message.toLowerCase();
    if (
      normalizedError.includes("already registered") ||
      normalizedError.includes("already exists") ||
      normalizedError.includes("email_exists") ||
      normalizedError.includes("user_already_exists")
    ) {
      redirect(
        "/login?mode=signup&message=" +
          encodeURIComponent(
            "This email may already be registered. Try Log in or Forgot password, or use a different email address."
          )
      );
    }
    redirect("/login?mode=signup&error=" + encodeURIComponent(error.message));
  }

  // When email confirmations are enabled, Supabase intentionally returns an
  // obfuscated user with no identities for an existing email. Do not reveal
  // whether the address exists; give the user the useful next steps instead.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    redirect(
      "/login?mode=signup&message=" +
        encodeURIComponent(
          "This email may already be registered. Try Log in or Forgot password, or use a different email address."
        )
    );
  }

  if (data.session) redirect(next);
  redirect(
    "/login?mode=signup&message=" +
      encodeURIComponent("Check your email to confirm your RALLIVIO account.")
  );
}

export async function forgotPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/login?mode=reset&error=Enter%20your%20email%20address%20first.");

  const requestHeaders = await headers();
  const origin = getRequestOrigin(requestHeaders);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin + "/auth/callback?next=" + encodeURIComponent("/auth/reset-password"),
  });

  if (error) redirect("/login?mode=reset&error=" + encodeURIComponent(error.message));
  redirect("/login?mode=reset&message=If%20an%20account%20exists%20for%20that%20email,%20we%20sent%20a%20password%20reset%20link.");
}
