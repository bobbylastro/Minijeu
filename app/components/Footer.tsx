import Link from "next/link";

export default function Footer() {
  return (
    <footer className="gc-footer">
      <div className="gc-footer__inner">
        <span className="gc-footer__brand">Ultimate Playground</span>
        <nav className="gc-footer__links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/legal">Legal</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <p className="gc-footer__copy">© {new Date().getFullYear()} Ultimate Playground</p>
      </div>
    </footer>
  );
}
