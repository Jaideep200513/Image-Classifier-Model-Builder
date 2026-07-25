"use client";

import { useRef } from "react";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  style?: React.CSSProperties;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(61, 0, 153, 0.07)",
  style,
  onMouseEnter,
  onMouseLeave,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty("--mouse-x", `${x}px`);
    divRef.current.style.setProperty("--mouse-y", `${y}px`);
    divRef.current.style.setProperty("--spotlight-color", spotlightColor);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (divRef.current) {
      divRef.current.style.removeProperty("--mouse-x");
      divRef.current.style.removeProperty("--mouse-y");
    }
    if (onMouseLeave) onMouseLeave(e);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "white",
        ...style,
      }}
    >
      {/* Spotlight radial gradient layer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(300px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), var(--spotlight-color, rgba(61,0,153,0.07)), transparent 80%)",
          opacity: 1,
        }}
      />
      {children}
    </div>
  );
}
