"use client";
import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { RankTier } from "@/lib/ranks";

export interface RatingResult {
  won: boolean;
  pointsDelta: number;
  newPoints: number;
  rank: RankTier;
}

export function useRatingSubmit(gameType: string) {
  const { user } = useAuth();
  const [ratingResult, setRatingResult] = useState<RatingResult | null>(null);

  const submitRating = useCallback(async (myScore: number, opponentScore: number) => {
    if (!user) return null;
    try {
      const res = await fetch(`/api/ratings/${gameType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myScore, opponentScore }),
      });
      if (!res.ok) return null;
      const data: RatingResult = await res.json();
      setRatingResult(data);
      return data;
    } catch {
      return null;
    }
  }, [user, gameType]);

  return { submitRating, ratingResult };
}
