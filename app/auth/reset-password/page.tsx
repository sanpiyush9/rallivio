"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [error,setError] = useState("");
  const [saving,setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setSaving(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) { setError(error.message); setSaving(false); return; }
    router.replace("/login?message=Your%20password%20has%20been%20updated.");
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20,background:"radial-gradient(circle at 50% 8%,#8d4dff35,transparent 30%),#060817",color:"#fff"}}>
    <section style={{width:"min(460px,100%)",padding:34,border:"1px solid #ffffff1c",borderRadius:22,background:"#0b0e1e"}}>
      <div style={{textAlign:"center"}}><span style={{fontSize:8,letterSpacing:1.6,color:"#a96cff"}}>SECURE RECOVERY</span><h1>Choose a new password.</h1><p style={{color:"#8e8ba0",fontSize:11}}>Set a new password for your RALLIVIO account.</p></div>
      {error && <div style={{padding:10,borderRadius:9,background:"#ff476c12",color:"#ff9caf",fontSize:10,marginBottom:14}}>{error}</div>}
      <form onSubmit={submit} style={{display:"grid",gap:14}}>
        <label style={{display:"grid",gap:6,fontSize:10}}>New password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} autoComplete="new-password" required style={{height:45,border:"1px solid #ffffff18",borderRadius:10,background:"#070a16",color:"#fff",padding:"0 13px"}} /></label>
        <label style={{display:"grid",gap:6,fontSize:10}}>Confirm password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={8} autoComplete="new-password" required style={{height:45,border:"1px solid #ffffff18",borderRadius:10,background:"#070a16",color:"#fff",padding:"0 13px"}} /></label>
        <button disabled={saving} style={{height:46,border:0,borderRadius:10,background:"linear-gradient(135deg,#7845ff,#b65cff)",color:"#fff",fontWeight:800}}>{saving ? "Updating…" : "Update password"}</button>
      </form>
    </section>
  </main>;
}
