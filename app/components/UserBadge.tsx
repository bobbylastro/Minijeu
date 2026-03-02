"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getRank } from "@/lib/ranks";

interface UserBadgeProps {
  onLoginClick: () => void;
}

export default function UserBadge({ onLoginClick }: UserBadgeProps) {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button className="user-badge__login-btn" onClick={onLoginClick}>
        Sign in
      </button>
    );
  }

  // Show spinner while profile loads
  if (!profile) {
    return <div className="user-badge user-badge--loading"><span className="user-badge__dot" /></div>;
  }

  // We don't have per-game points in header — show generic badge
  const rank = getRank(0); // Default Bronze; will be enriched later if needed

  return (
    <div className="user-badge" onClick={() => setOpen(o => !o)}>
      <span className="user-badge__rank-emoji">{rank.emoji}</span>
      <span className="user-badge__name">{profile.username}</span>
      <svg className="user-badge__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {open && (
        <div className="user-badge__dropdown" onClick={e => e.stopPropagation()}>
          <Link href="/profile" className="user-badge__dropdown-item" onClick={() => setOpen(false)}>
            👤 My Profile
          </Link>
          <Link href="/leaderboard" className="user-badge__dropdown-item" onClick={() => setOpen(false)}>
            🏆 Leaderboard
          </Link>
          <div className="user-badge__dropdown-divider" />
          <button className="user-badge__dropdown-item user-badge__dropdown-item--danger" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
