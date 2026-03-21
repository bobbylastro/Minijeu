"use client";
import { useRef } from "react";

export default function GameSlider({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 292, behavior: "smooth" });
  };

  return (
    <div className="game-slider">
      <button
        className="game-slider__arrow game-slider__arrow--left"
        onClick={() => scroll(-1)}
        aria-label="Previous games"
      >
        ‹
      </button>
      <div className="game-slider__track" ref={trackRef}>
        {children}
      </div>
      <button
        className="game-slider__arrow game-slider__arrow--right"
        onClick={() => scroll(1)}
        aria-label="Next games"
      >
        ›
      </button>
    </div>
  );
}
