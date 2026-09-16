import type { ReactNode } from "react";

export default function LivingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        .fieldHint{display:none!important}
        .hero{
          min-height:calc(100vh - 88px)!important;
          padding:32px 48px!important;
          display:flex!important;
          align-items:center!important;
          justify-content:space-between!important;
          gap:48px!important;
        }
        .heroCopy{flex:0 1 560px}
        .ecosystem{
          flex:1 1 0;
          display:flex;
          align-items:center;
          justify-content:center;
          min-width:0;
          overflow:visible!important;
        }
        .field{
          width:min(100%,560px,62vh)!important;
          margin:0 auto!important;
          overflow:visible!important;
        }
        .fieldSpace{overflow:visible!important}
      `}</style>
      {children}
    </>
  );
}
