import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Ultimate Playground.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="glow-orb glow-orb--purple" />
      <div className="glow-orb glow-orb--orange" />
      <div className="legal-card">
        <span className="legal-card__badge">Legal</span>
        <h1 className="legal-card__title">Terms of Service</h1>
        <p className="legal-card__meta">Last updated: March 3, 2026</p>

        <div className="legal-section">
          <p className="legal-section__body">
            By accessing <strong style={{ color: "white" }}>Ultimate Playground</strong> (ultimate-playground.com),
            you agree to these terms. If you do not agree, please do not use the website.
          </p>
        </div>

        <hr className="legal-divider" />

        <div className="legal-section">
          <h2 className="legal-section__title">1. Use of the Website</h2>
          <div className="legal-section__body">
            <ul>
              <li>The website is provided for entertainment purposes</li>
              <li>You agree not to misuse or disrupt the service</li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">2. Accounts</h2>
          <div className="legal-section__body">
            <ul>
              <li>You are responsible for your account and its activity</li>
              <li>You must provide accurate information when registering</li>
              <li>We may suspend or terminate accounts in case of abuse</li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">3. Game Data</h2>
          <div className="legal-section__body">
            <ul>
              <li>Scores and rankings are for entertainment purposes only</li>
              <li>We reserve the right to reset or remove any game data at any time</li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">4. Intellectual Property</h2>
          <div className="legal-section__body">
            <p>
              All content, games, and design on this website belong to Ultimate Playground.
              Unauthorized reproduction or redistribution is prohibited.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">5. Limitation of Liability</h2>
          <div className="legal-section__body">
            <p>We are not responsible for:</p>
            <ul>
              <li>Data loss</li>
              <li>Service interruptions</li>
              <li>Inaccuracies in game data</li>
            </ul>
            <p>
              The service is provided &quot;as is&quot; without any warranty of any kind,
              express or implied.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">6. Changes</h2>
          <div className="legal-section__body">
            <p>
              We may modify these terms or the service at any time without prior notice.
              Continued use of the website after changes constitutes your acceptance of
              the updated terms.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">7. Contact</h2>
          <div className="legal-section__body">
            <p>
              For any questions regarding these terms, contact us at:{" "}
              <a href="mailto:ultimate.playground.contact@gmail.com">
                ultimate.playground.contact@gmail.com
              </a>{" "}
              or via our <Link href="/contact">contact page</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
