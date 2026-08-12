import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";

interface PhotoDetailViewerProps {
  primaryImage: string;
  productTitle: string;
  angles?: string[];
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
}

export function PhotoDetailViewer({
  primaryImage,
  productTitle,
  angles,
}: PhotoDetailViewerProps) {
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);
  const [transformStyle, setTransformStyle] = useState("");
  const [shadowStyle, setShadowStyle] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeSrc =
    angles && angles.length > 0 ? angles[activeAngleIndex] : primaryImage;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const isTouch =
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window;
      setIsDisabled(reducedMotion || isTouch);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const maxTilt = 12;
    const rotateX = (((y - centerY) / centerY) * -maxTilt).toFixed(2);
    const rotateY = (((x - centerX) / centerX) * maxTilt).toFixed(2);

    const shadowX = (((x - centerX) / centerX) * -24).toFixed(1);
    const shadowY = (((y - centerY) / centerY) * -24).toFixed(1);

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`,
    );
    setShadowStyle(`${shadowX}px ${shadowY}px 40px -8px rgba(0, 0, 0, 0.3)`);
  };

  const handleMouseLeave = () => {
    if (isDisabled) return;
    setTransformStyle(
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    );
    setShadowStyle("0 20px 40px -10px rgba(0, 0, 0, 0.15)");
  };

  return (
    <div className="space-y-4">
      {/* Stage Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: transformStyle,
          boxShadow: shadowStyle,
          transition: transformStyle.includes("rotateX(0deg)")
            ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            : "transform 0.1s ease-out, box-shadow 0.1s ease-out",
        }}
        className="spatial-surface aspect-[4/3] rounded-3xl overflow-hidden relative group will-change-transform bg-card/60 border border-border/80 shadow-xl"
      >
        {/* Real Product Photo */}
        <img
          src={activeSrc}
          alt={productTitle}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Floating Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 rounded-full spatial-float text-[11px] font-bold text-primary flex items-center gap-1.5 border border-primary/20 shadow-md">
            <Maximize2 className="h-3.5 w-3.5" />
            <span>High-Res Detail View</span>
          </span>
        </div>
      </div>

      {/* Discrete Angle Switcher (If multiple photo angles exist) */}
      {angles && angles.length > 1 && (
        <div className="grid grid-cols-4 gap-3 pt-2">
          {angles.map((src, idx) => (
            <button
              key={idx}
              onClick={() => setActiveAngleIndex(idx)}
              className={cn(
                "aspect-square rounded-2xl overflow-hidden border-2 transition-all spatial-surface cursor-pointer bg-card",
                activeAngleIndex === idx
                  ? "border-primary ring-2 ring-primary/30 scale-105 opacity-100 shadow-md"
                  : "border-border/40 opacity-75 hover:opacity-100 hover:border-primary/50",
              )}
            >
              <img
                src={src}
                alt={`Angle ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
