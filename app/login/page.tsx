"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, signup, forgotPassword } from "./actions";

const shell = { minHeight: "100vh", display: "grid", placeItems: "center", padding: "90px 20px 40px", background: "radial-gradient(circle at 50% 8%, #8d4dff35, transparent 30%), #060817", color: "#f7f6ff" };
const card = { width: "min(460px,100%)", padding: "34px", border: "1px solid #ffffff1c", borderRadius: "22px", background: "#0b0e1eea", boxShadow: "0 35px 100px #0008" };
const input = { width: "100%", height: "45px", border: "1px solid #ffffff18", borderRadius: "10px", background: "#070a16", color: "#fff", padding: "0 13px", outline: "none" };
const button = { height: "46px", border: 0, borderRadius: "10px", background: "linear-gradient(135deg,#7845ff,#b65cff)", color: "#fff", fontSize: "12px", fontWeight: 800 };

export default function LoginPage() {
  const params = useSearchParams();
  const mode = params.get("mode") === "signup" || params.get("mode") === "reset" ? params.get("mode") : "login";
  const next = params.get("next")?.startsWith("/") ? params.get("next") : "/living";
  const error = params.get("error");
  const message = params.get("message");

  return (
    <main style={shell}>
      <Link href="/living" style={{ position: "absolute", top: 25, left: 32, color: "#fff", textDecoration: "none" }}>
        <strong style={{ display: "block", fontSize: 25 }}>RALLIVIO</strong>
        <small style={{ color: "#aaa8bd", fontSize: 7, letterSpacing: 1 }}>DISCOVER. WATCH. GROW.</small>
      </Link>
      <section style={card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 8, letterSpacing: 1.6, color: "#a96cff", fontWeight: 900 }}>
            {mode === "signup" ? "JOIN RALLIVIO" : mode === "reset" ? "ACCOUNT RECOVERY" : "WELCOME BACK"}
          </span>
          <h1 style={{ margin: "9px 0 8px", fontSize: 31 }}>{mode === "signup" ? "Create your account." : mode === "reset" ? "Reset your password." : "Welcome back."}</h1>
          <p style={{ color: "#8e8ba0", fontSize: 11 }}>
            {mode === "signup" ? "Create your free RALLIVIO account and start your creator journey." : mode === "reset" ? "Enter your email and we’ll send you a secure reset link." : "Sign in to continue your RALLIVIO journey."}
          </p>
        </div>

        {error && <div style={{ padding: 10, marginBottom: 14, borderRadius: 9, background: "#ff476c12", color: "#ff9caf", fontSize: 10 }}>{error}</div>}
        {message && <div style={{ padding: 10, marginBottom: 14, borderRadius: 9, background: "#36d99a10", color: "#7ce4b9", fontSize: 10 }}>{message}</div>}

        {mode === "login" && <form action={login} style={{ display: "grid", gap: 14 }}>
          <input type="hidden" name="next" value={next ?? "/living"} />
          <label style={{ display: "grid", gap: 6, fontSize: 10 }}>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" style={input} required /></label>
          <label style={{ display: "grid", gap: 6, fontSize: 10 }}>Password<input name="password" type="password" autoComplete="current-password" placeholder="••••••••" style={input} required /></label>
          <div style={{ textAlign: "right", fontSize: 9 }}><Link href="/login?mode=reset" style={{ color: "#b581ff" }}>Forgot password?</Link></div>
          <button type="submit" style={button}>Log in</button>
        </form>}

        {mode === "signup" && <form action={signup} style={{ display: "grid", gap: 14 }}>
          <input type="hidden" name="next" value={next ?? "/living"} />
          <label style={{ display: "grid", gap: 6, fontSize: 10 }}>Display name <small>(optional)</small><input name="display_name" autoComplete="name" placeholder="Your name or creator name" style={input} /></label>
          <label style={{ display: "grid", gap: 6, fontSize: 10 }}>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" style={input} required /></label>
          <label style={{ display: "grid", gap: 6, fontSize: 10 }}>Password<input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} style={input} required /></label>
          <button type="submit" style={button}>Create free account</button>
          <p style={{ textAlign: "center", color: "#666375", fontSize: 8 }}>By creating an account, you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        </form>}

        {mode === "reset" && <form action={forgotPassword} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 10 }}>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" style={input} required /></label>
          <button type="submit" style={button}>Send reset link</button>
        </form>}

        <div style={{ textAlign: "center", marginTop: 22, paddingTop: 18, borderTop: "1px solid #ffffff10", color: "#777487", fontSize: 10 }}>
          {mode === "login" ? <>New to RALLIVIO? <Link href="/login?mode=signup">Create an account</Link></> : mode === "signup" ? <>Already have an account? <Link href="/login">Log in</Link></> : <>Remember your password? <Link href="/login">Back to login</Link></>}
        </div>
      </section>
    </main>
  );
}
