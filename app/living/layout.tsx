import type { ReactNode } from "react";

export default function LivingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        /* Living field: square coordinate system matching the position editor. */
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

        /* Final editor coordinates bound by platform identity, not DOM order. */
        .field .platform:has(.platformMark.youtube)   { left: 38.8% !important; top: 13.3% !important; }
        .field .platform:has(.platformMark.instagram) { left: 69.4% !important; top: 18.1% !important; }
        .field .platform:has(.platformMark.tiktok)    { left: 81.9% !important; top: 31.7% !important; }
        .field .platform:has(.platformMark.x)         { left: 19.5% !important; top: 31.3% !important; }
        .field .platform:has(.platformMark.linkedin)  { left: 83.6% !important; top: 64% !important; }
        .field .platform:has(.platformMark.facebook)  { left: 16.4% !important; top: 62% !important; }
        .field .platform:has(.platformMark.reddit)    { left: 77.2% !important; top: 47% !important; }
        .field .platform:has(.platformMark.twitch)    { left: 49.6% !important; top: 86.4% !important; }
        .field .platform:has(.platformMark.discord)   { left: 49.4% !important; top: 23.1% !important; }
        .field .platform:has(.platformMark.spotify)   { left: 34.1% !important; top: 70.7% !important; }
        .field .platform:has(.platformMark.pinterest) { left: 26.1% !important; top: 43.3% !important; }
        .field .platform:has(.platformMark.snapchat)  { left: 65.3% !important; top: 71.5% !important; }

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
