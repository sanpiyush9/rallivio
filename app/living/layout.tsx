import type { ReactNode } from "react";

export default function LivingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        /* Living orbit: percentage coordinates must resolve against a true square. */
        .field {
          position: relative !important;
          width: min(680px, 90vw) !important;
          aspect-ratio: 1 / 1 !important;
          height: auto !important;
          min-height: 0 !important;
          flex: 0 0 auto !important;
          flex-shrink: 0 !important;
          margin: 0 auto !important;
        }

        .fieldSpace {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
        }

        .field .platform {
          position: absolute !important;
          width: 110px !important;
          min-width: 110px !important;
          margin: 0 !important;
          padding: 0 !important;
          transform: translate(-50%, -50%) !important;
          rotate: none !important;
          scale: 1 !important;
          z-index: 35 !important;
          text-align: center !important;
        }

        /* The page renders platforms as buttons in this exact DOM order. */
        .field .platform:nth-of-type(1)  { left: 50% !important; top: 8% !important; }
        .field .platform:nth-of-type(2)  { left: 29% !important; top: 13.6% !important; }
        .field .platform:nth-of-type(3)  { left: 71% !important; top: 13.6% !important; }
        .field .platform:nth-of-type(4)  { left: 13.6% !important; top: 29% !important; }
        .field .platform:nth-of-type(5)  { left: 71% !important; top: 86.4% !important; }
        .field .platform:nth-of-type(6)  { left: 86.4% !important; top: 29% !important; }
        .field .platform:nth-of-type(7)  { left: 29% !important; top: 86.4% !important; }
        .field .platform:nth-of-type(8)  { left: 13.6% !important; top: 71% !important; }
        .field .platform:nth-of-type(9)  { left: 8% !important; top: 50% !important; }
        .field .platform:nth-of-type(10) { left: 50% !important; top: 92% !important; }
        .field .platform:nth-of-type(11) { left: 92% !important; top: 50% !important; }
        .field .platform:nth-of-type(12) { left: 86.4% !important; top: 71% !important; }

        .field .platform:hover,
        .field .platform:focus-visible,
        .field .platform.selected {
          transform: translate(-50%, -50%) !important;
          scale: 1 !important;
          rotate: none !important;
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

        /* Keep the existing platform icon implementation and colors unchanged. */
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

        @media (max-width: 800px) {
          .field {
            width: min(680px, 92vw) !important;
          }
          .field .platform {
            width: 88px !important;
            min-width: 88px !important;
          }
          .field .platformMark {
            width: 50px !important;
            height: 50px !important;
            border-radius: 15px !important;
          }
        }
      `}</style>
      {children}
    </>
  );
}
