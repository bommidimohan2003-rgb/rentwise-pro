import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CSSTiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
}

export function CSSTiltCard({
  children,
  className,
  maxTilt = 10,
  scale = 1.02,
}: CSSTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>("");
  const [shadowStyle, setShadowStyle] = useState<string>("");
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
      setIsDisabled(reducedMotion || isTouch);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (((y - centerY) / centerY) * -maxTilt).toFixed(2);
    const rotateY = (((x - centerX) / centerX) * maxTilt).toFixed(2);

    const shadowX = (((x - centerX) / centerX) * -15).toFixed(1);
    const shadowY = (((y - centerY) / centerY) * -15).toFixed(1);

    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`);
    setShadowStyle(`${shadowX}px ${shadowY}px 30px -5px rgba(0, 0, 0, 0.25)`);
  };

  const handleMouseLeave = () => {
    if (isDisabled) return;
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setShadowStyle("0 12px 28px -6px rgba(0, 0, 0, 0.1)");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        boxShadow: shadowStyle,
        transition: transformStyle.includes("rotateX(0deg)")
          ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          : "transform 0.1s ease-out, box-shadow 0.1s ease-out",
      }}
      className={cn("will-change-transform rounded-2xl", className)}
    >
      {children}
    </div>
  );
}
