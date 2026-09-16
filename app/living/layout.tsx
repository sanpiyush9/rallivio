import type { ReactNode } from "react";

export default function LivingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`.fieldHint{display:none!important}`}</style>
      {children}
    </>
  );
}
