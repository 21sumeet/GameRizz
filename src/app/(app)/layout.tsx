import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/page-shell";

/**
 * Layout for the product surfaces (chat + recommender). Marketing pages live
 * outside this group so they can use their own full-bleed chrome.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
