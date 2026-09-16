import type { ReactNode } from "react";

export default function LivingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        /* RALLIVIO platform-field QA correction: keep every platform outside the core. */
        .field .platform {
          transform: translate(-50%, -50%) rotate(var(--angle)) translateX(calc(115px + var(--orbit) * 55px)) rotate(calc(var(--angle) * -1)) !important;
          z-index: 35 !important;
        }
        .field .platform:hover,
        .field .platform:focus-visible,
        .field .platform.selected {
          transform: translate(-50%, -50%) rotate(var(--angle)) translateX(calc(115px + var(--orbit) * 55px)) rotate(calc(var(--angle) * -1)) scale(1.08) !important;
          z-index: 60 !important;
        }
        .field .platformMark {
          width: 62px !important;
          height: 62px !important;
          border-radius: 18px !important;
          background: #111426 !important;
        }
        .field .platform b { margin-top: 7px !important; }
        .field .platform small { opacity: .9; }
        /* Brand-like logo treatment for the existing inline vector marks. */
        .field .platformMark.youtube { color: #ff0033 !important; }
        .field .platformMark.instagram { color: #e1306c !important; }
        .field .platformMark.tiktok { color: #ffffff !important; }
        .field .platformMark.x { color: #ffffff !important; }
        .field .platformMark.linkedin { color: #0a66c2 !important; }
        .field .platformMark.spotify { color: #1ed760 !important; }
        .field .platformMark.twitch { color: #9146ff !important; }
        .field .platformMark.facebook { color: #1877f2 !important; }
        .field .platformMark.pinterest { color: #e60023 !important; }
        .field .platformMark.reddit { color: #ff4500 !important; }
        .field .platformMark.discord { color: #5865f2 !important; }
        .field .platformMark.snapchat { color: #fffc00 !important; }
        @media (max-width: 600px) {
          .field .platform {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(calc(105px + var(--orbit) * 43px)) rotate(calc(var(--angle) * -1)) !important;
          }
          .field .platform:hover,
          .field .platform:focus-visible,
          .field .platform.selected {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(calc(105px + var(--orbit) * 43px)) rotate(calc(var(--angle) * -1)) scale(1.06) !important;
          }
          .field .platformMark { width: 50px !important; height: 50px !important; }
        }
      `}</style>
      {children}
    </>
  );
}
