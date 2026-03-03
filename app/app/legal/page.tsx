import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Notice",
  description: "Legal information about Ultimate Playground.",
  robots: { index: false, follow: false },
};

export default function LegalPage() {
  return (
    <div className="legal-page">
      <div className="glow-orb glow-orb--purple" />
      <div className="glow-orb glow-orb--orange" />
      <div className="legal-card">
        <span className="legal-card__badge">Legal</span>
        <h1 className="legal-card__title">Legal Notice</h1>
        <p className="legal-card__meta">Last updated: March 3, 2026</p>

        <hr className="legal-divider" />

        <div className="legal-section">
          <h2 className="legal-section__title">Publisher</h2>
          <div className="legal-section__body">
            <p>This website is operated by <strong style={{ color: "white" }}>Ultimate Playground</strong>.</p>
            <p>
              Contact:{" "}
              <a href="mailto:ultimate.playground.contact@gmail.com">
                ultimate.playground.contact@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">Hosting</h2>
          <div className="legal-section__body">
            <p>
              Hosting provider: <strong style={{ color: "white" }}>Vercel Inc.</strong>
              <br />
              440 N Barranca Ave #4133, Covina, CA 91723, USA
              <br />
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">Intellectual Property</h2>
          <div className="legal-section__body">
            <p>
              All content, games, and design on this website are the exclusive property of
              Ultimate Playground. Any reproduction, distribution, or use without prior
              written consent is prohibited.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">Applicable Law</h2>
          <div className="legal-section__body">
            <p>
              This website is subject to applicable law. Users located in the European Union
              benefit from the protections provided by the GDPR. For more information,
              see our <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
