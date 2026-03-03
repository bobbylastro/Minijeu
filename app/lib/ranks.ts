export interface RankTier {
  name: string;
  emoji: string;
  minPoints: number;
  floor: number;
}

export const RANKS: RankTier[] = [
  { name: "Bronze",   emoji: "🥉", minPoints: 0,     floor: 0     },
  { name: "Silver",   emoji: "🥈", minPoints: 1000,  floor: 1000  },
  { name: "Gold",     emoji: "🏅", minPoints: 2500,  floor: 2500  },
  { name: "Platinum", emoji: "💎", minPoints: 5000,  floor: 5000  },
  { name: "Diamond",  emoji: "💠", minPoints: 9000,  floor: 9000  },
  { name: "Master",   emoji: "👑", minPoints: 14000, floor: 14000 },
];

export const POINTS_WIN  = 50;
export const POINTS_LOSS = 25;

export function getRank(points: number): RankTier {
  let rank = RANKS[0];
  for (const tier of RANKS) {
    if (points >= tier.minPoints) rank = tier;
  }
  return rank;
}


export function getRankFloor(points: number): number {
  return getRank(points).floor;
}
