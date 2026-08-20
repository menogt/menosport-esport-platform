import { useEffect, useRef, useState, type PropsWithChildren } from "react";

export function SpotlightFrame({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`spotlight-frame ${className}`}>{children}</div>;
}

export function ShimmerLine() {
  return <span className="shimmer-line" aria-hidden="true" />;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  distance = "18px",
}: PropsWithChildren<{ className?: string; delay?: number; distance?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.14, rootMargin: "0px 0px -8%" });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms`, "--reveal-distance": distance } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
