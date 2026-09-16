import type { ReactNode } from "react";

export default function LivingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        .fieldHint{display:none!important}
        .field{transform:scale(.78);transform-origin:center center}
      `}</style>
      {children}
    </>
  );
}
