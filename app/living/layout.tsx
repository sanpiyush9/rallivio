import type { ReactNode } from "react";

export default function LivingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        .rv .fieldHint{display:none!important}
        .rv .hero{
          display:flex!important;
          align-items:center!important;
          justify-content:space-between!important;
          height:calc(100vh - 88px)!important;
          min-height:0!important;
          padding:24px 48px!important;
          gap:48px!important;
          overflow:hidden!important;
        }
        .rv .heroCopy{
          flex:0 1 560px!important;
          max-width:560px!important;
        }
        .rv .ecosystem{
          position:relative!important;
          flex:1 1 0!important;
          min-width:0!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          overflow:visible!important;
        }
        .rv .field{
          width:min(100%,520px,58vh)!important;
          max-width:520px!important;
          margin:0 auto!important;
          overflow:visible!important;
        }
        .rv .fieldSpace{overflow:visible!important}
      `}</style>
      {children}
    </>
  );
}
