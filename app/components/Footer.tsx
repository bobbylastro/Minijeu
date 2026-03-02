import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="site-footer__links">
        <Link href="/terms" className="site-footer__link">Terms</Link>
        <span className="site-footer__sep">·</span>
        <Link href="/privacy" className="site-footer__link">Privacy</Link>
        <span className="site-footer__sep">·</span>
        <Link href="/cookies" className="site-footer__link">Cookies</Link>
        <span className="site-footer__sep">·</span>
        <Link href="/contact" className="site-footer__link">Contact</Link>
      </nav>
      <p className="site-footer__copy">© {new Date().getFullYear()} Minijeu</p>
    </footer>
  );
}
