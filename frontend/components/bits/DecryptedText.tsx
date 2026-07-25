"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  animateOn?: "hover" | "view";
}

export default function DecryptedText({
  text,
  speed = 60,
  maxIterations = 8,
  sequential = true,
  revealDirection = "start",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  className = "",
  encryptedClassName = "",
  animateOn = "hover",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set<number>());
  const [hasAnimated, setHasAnimated] = useState(false);

  const containerRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableChars = useMemo(() => characters.split(""), [characters]);

  const shuffleText = useCallback(
    (originalText: string, currentRevealed: Set<number>) => {
      return originalText
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (currentRevealed.has(i)) return originalText[i];
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join("");
    },
    [availableChars]
  );

  const startAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    const revealed = new Set<number>();
    let pointer = 0;
    let iterations = 0;

    intervalRef.current = setInterval(() => {
      if (sequential) {
        if (pointer < text.length) {
          if (text[pointer] === " ") {
            revealed.add(pointer);
            pointer++;
          } else {
            iterations++;
            if (iterations >= maxIterations) {
              revealed.add(pointer);
              pointer++;
              iterations = 0;
            }
          }
          setRevealedIndices(new Set(revealed));
          setDisplayText(shuffleText(text, revealed));
        } else {
          clearInterval(intervalRef.current!);
          setIsAnimating(false);
          setHasAnimated(true);
          setDisplayText(text);
        }
      } else {
        setDisplayText(shuffleText(text, revealed));
        iterations++;
        if (iterations >= maxIterations) {
          clearInterval(intervalRef.current!);
          setIsAnimating(false);
          setHasAnimated(true);
          setDisplayText(text);
        }
      }
    }, speed);
  }, [isAnimating, text, sequential, maxIterations, speed, shuffleText]);

  const stopAnimation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setDisplayText(text);
    setRevealedIndices(new Set());
  }, [text]);

  useEffect(() => {
    if (animateOn !== "view") return;
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) startAnimation();
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animateOn, hasAnimated, startAnimation]);

  return (
    <span
      ref={containerRef}
      onMouseEnter={animateOn === "hover" ? startAnimation : undefined}
      onMouseLeave={animateOn === "hover" ? stopAnimation : undefined}
      className="inline-block"
    >
      {displayText.split("").map((char, i) => (
        <span
          key={i}
          className={revealedIndices.has(i) || !isAnimating ? className : encryptedClassName}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
