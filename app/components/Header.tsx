"use client";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";

const AuthModal     = dynamic(() => import("@/components/AuthModal"),     { ssr: false });
const UsernameModal = dynamic(() => import("@/components/UsernameModal"), { ssr: false });
const UserBadge     = dynamic(() => import("@/components/UserBadge"),     { ssr: false });

export default function Header() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="gc-header">
        <div className="gc-header__inner">
          <Link href="/" className="gc-header__logo">
            <span className="gc-header__logo-full">Ultimate<span className="site-header__logo-accent"> Playground</span></span>
            <span className="gc-header__logo-short">U<span className="site-header__logo-accent">P</span></span>
          </Link>

          <Link href="/blog" className="gc-header__blog-link">Blog</Link>

          <Link href="/submit" className="gc-header__submit-btn">
            <span className="gc-header__submit-label">+ Submit a clip</span>
            <span className="gc-header__submit-short">+ Submit</span>
          </Link>

          <div className="gc-header__auth">
            <UserBadge onLoginClick={() => setAuthOpen(true)} />
          </div>
        </div>
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {!loading && !profileLoading && user && !profile && <UsernameModal onClose={() => {}} />}
    </>
  );
}
