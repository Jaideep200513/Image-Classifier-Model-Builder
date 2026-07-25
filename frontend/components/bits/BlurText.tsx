"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  animateBy?: "words" | "chars";
  direction?: "top" | "bottom";
  stepDuration?: number;
  onAnimationComplete?: () => void;
}

export default function BlurText({
  text = "",
  delay = 120,
  className = "",
  style,
  animateBy = "words",
  direction = "bottom",
  stepDuration = 0.4,
  onAnimationComplete,
}: BlurTextProps) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current!);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const fromY = direction === "top" ? -24 : 24;
  const animationFrom = { filter: "blur(8px)", opacity: 0, y: fromY };
  const animationTo = [
    { filter: "blur(4px)", opacity: 0.5, y: fromY / 2 },
    { filter: "blur(0px)", opacity: 1, y: 0 },
  ];

  return (
    <p ref={ref} className={`flex flex-wrap ${className}`} style={style}>
      {elements.map((el, i) => (
        <motion.span
          key={i}
          initial={animationFrom}
          animate={inView ? animationTo[1] : animationFrom}
          transition={{
            duration: stepDuration,
            delay: i * (delay / 1000),
            ease: "easeOut",
          }}
          onAnimationComplete={
            i === elements.length - 1 ? onAnimationComplete : undefined
          }
          className="inline-block"
          style={{ marginRight: animateBy === "words" ? "0.28em" : "0px" }}
        >
          {el}
        </motion.span>
      ))}
    </p>
  );
}
