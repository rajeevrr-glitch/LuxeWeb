import type { ReactNode } from "react";
import { StudioHeader as SiteHeader, StudioFooter as SiteFooter } from "./StudioLayout";


export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

