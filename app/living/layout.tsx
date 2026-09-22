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
          flex:0 1 620px!important;
          max-width:620px!important;
          transform:translateY(-18px)!important;
        }
        .rv .heroCopy h1{
          font-size:clamp(72px,5.2vw,96px)!important;
          line-height:.94!important;
          letter-spacing:-.045em!important;
          margin:16px 0!important;
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

        /* Brand identity only: geometry and icon implementation remain unchanged. */
        .rv .platformMark{
          width:56px!important;
          height:56px!important;
          border-radius:50%!important;
          border:0!important;
          box-shadow:0 0 20px var(--brand-glow),0 10px 28px #0006!important;
          background:var(--brand-fill)!important;
          color:var(--brand-logo)!important;
        }
        .rv .platformMark svg{width:28px!important;height:28px!important}
        .rv .platformMark.youtube{--brand-fill:#FF0000;--brand-logo:#fff;--brand-glow:#FF000066}
        .rv .platformMark.instagram{--brand-fill:linear-gradient(45deg,#833AB4,#FD1D1D,#FCB045);--brand-logo:#fff;--brand-glow:#FD1D1D66}
        .rv .platformMark.tiktok{--brand-fill:#000;--brand-logo:#fff;--brand-glow:#ffffff33;box-shadow:0 0 20px #ffffff22,0 10px 28px #0008!important;border:1px solid rgba(255,255,255,.2)!important}
        .rv .platformMark.x{--brand-fill:#000;--brand-logo:#fff;--brand-glow:#ffffff33;box-shadow:0 0 20px #ffffff22,0 10px 28px #0008!important;border:1px solid rgba(255,255,255,.2)!important}
        .rv .platformMark.linkedin{--brand-fill:#0A66C2;--brand-logo:#fff;--brand-glow:#0A66C266}
        .rv .platformMark.facebook{--brand-fill:#1877F2;--brand-logo:#fff;--brand-glow:#1877F266}
        .rv .platformMark.reddit{--brand-fill:#FF4500;--brand-logo:#fff;--brand-glow:#FF450066}
        .rv .platformMark.discord{--brand-fill:#5865F2;--brand-logo:#fff;--brand-glow:#5865F266}
        .rv .platformMark.snapchat{--brand-fill:#FFFC00;--brand-logo:#000;--brand-glow:#FFFC0066}
        .rv .platformMark.pinterest{--brand-fill:#E60023;--brand-logo:#fff;--brand-glow:#E6002366}
        .rv .platformMark.spotify{--brand-fill:#1DB954;--brand-logo:#000;--brand-glow:#1DB95466}
        .rv .platformMark.twitch{--brand-fill:#9146FF;--brand-logo:#fff;--brand-glow:#9146FF66}

        .rv .platformMark.youtube svg rect,
        .rv .platformMark.linkedin svg rect,
        .rv .platformMark.twitch svg path:first-child,
        .rv .platformMark.spotify svg circle,
        .rv .platformMark.facebook svg circle,
        .rv .platformMark.pinterest svg circle,
        .rv .platformMark.reddit svg circle{fill:transparent!important}
        .rv .platformMark.youtube svg path,
        .rv .platformMark.linkedin svg circle,
        .rv .platformMark.linkedin svg path,
        .rv .platformMark.twitch svg path:last-child,
        .rv .platformMark.facebook svg path,
        .rv .platformMark.pinterest svg path,
        .rv .platformMark.discord svg path{fill:var(--brand-logo)!important}
        .rv .platformMark.instagram svg rect,
        .rv .platformMark.instagram svg circle{fill:none!important;stroke:var(--brand-logo)!important}
        .rv .platformMark.instagram svg circle:last-child{fill:var(--brand-logo)!important;stroke:none!important}
        .rv .platformMark.tiktok svg path,
        .rv .platformMark.x svg path,
        .rv .platformMark.snapchat svg path{fill:var(--brand-logo)!important}
        .rv .platformMark.spotify svg path{stroke:var(--brand-logo)!important}
        .rv .platformMark.reddit svg path{stroke:var(--brand-logo)!important}
        .rv .platformMark.discord svg circle{fill:#0b0d20!important}

        /* Campaign Spotlight: never leave a single campaign stranded at the far left. */
        .rv .pulseSection:not(:has(.viewSignalsButton)) .pulseViewport{overflow:hidden!important}
        .rv .pulseSection:not(:has(.viewSignalsButton)) .pulseCards{justify-content:center!important;align-items:stretch!important}
        .rv .pulseSection:not(:has(.viewSignalsButton)) .pulseCard{flex:0 1 520px!important;width:min(520px,100%)!important}
        .rv .pulseSection:not(:has(.viewSignalsButton)) .pulseThumb{height:170px!important}
        .rv .pulseSection:not(:has(.viewSignalsButton)) .pulseCards:empty{display:none!important}

        /* Timeframe is a rolling observation window, never a cumulative lifetime total. */
        .rv .timeframeLabel span{max-width:390px!important}
        .rv .timeframeMeta small::after{content:" · rolling window";color:#4f9fca!important}
      `}</style>
      {children}
    </>
  );
}
