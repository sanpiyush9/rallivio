import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  return <main style={{minHeight:"100vh",padding:"110px 24px",background:"radial-gradient(circle at 50% 8%,#8d4dff30,transparent 30%),#060817",color:"#fff"}}>
    <section style={{width:"min(720px,100%)",margin:"0 auto",padding:30,border:"1px solid #ffffff18",borderRadius:18,background:"#0b0e1e"}}>
      <span style={{fontSize:8,letterSpacing:1.5,color:"#a96cff"}}>YOUR RALLIVIO ACCOUNT</span>
      <h1 style={{margin:"8px 0"}}>Account</h1>
      <p style={{color:"#8e8ba0",fontSize:12}}>You’re signed in as <strong style={{color:"#fff"}}>{user.email}</strong>.</p>
      <Link href="/living" style={{display:"inline-block",marginTop:15,color:"#b581ff",textDecoration:"none"}}>← Back to RALLIVIO</Link>
    </section>
  </main>;
}
