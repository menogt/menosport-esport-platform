import type { PropsWithChildren } from "react";

export function SpotlightFrame({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`spotlight-frame ${className}`}>{children}</div>;
}

export function ShimmerLine() {
  return <span className="shimmer-line" aria-hidden="true" />;
}
