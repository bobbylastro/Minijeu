import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__col">
          <p className="site-footer__col-title">Popular Games</p>
          <Link href="/football" className="site-footer__link">Football Quiz</Link>
          <Link href="/nba" className="site-footer__link">NBA Quiz</Link>
          <Link href="/wild-battle" className="site-footer__link">Wild Battle</Link>
          <Link href="/career" className="site-footer__link">Career Order</Link>
          <Link href="/origins" className="site-footer__link">Origins Quiz</Link>
        </div>
        <div className="site-footer__col">
          <p className="site-footer__col-title">Blog</p>
          <Link href="/blog/best-online-football-quiz-games" className="site-footer__link">Best Football Quiz Games</Link>
          <Link href="/blog/best-online-geography-quiz-games" className="site-footer__link">Best Geography Quiz Games</Link>
          <Link href="/blog/online-trivia-games-to-play-with-friends" className="site-footer__link">Trivia Games with Friends</Link>
          <Link href="/blog" className="site-footer__link">All Articles →</Link>
        </div>
        <div className="site-footer__col">
          <p className="site-footer__col-title">Legal</p>
          <Link href="/terms" className="site-footer__link">Terms of Service</Link>
          <Link href="/privacy" className="site-footer__link">Privacy Policy</Link>
          <Link href="/cookies" className="site-footer__link">Cookie Policy</Link>
          <Link href="/legal" className="site-footer__link">Legal Notice</Link>
          <Link href="/contact" className="site-footer__link">Contact</Link>
        </div>
      </div>
      <p className="site-footer__copy">© {new Date().getFullYear()} Ultimate Playground</p>
    </footer>
  );
}
