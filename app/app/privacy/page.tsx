import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ultimate Playground collects, uses, and protects your personal data.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="glow-orb glow-orb--purple" />
      <div className="glow-orb glow-orb--orange" />
      <div className="legal-card">
        <span className="legal-card__badge">Legal</span>
        <h1 className="legal-card__title">Privacy Policy</h1>
        <p className="legal-card__meta">Last updated: March 3, 2026</p>

        <div className="legal-section">
          <p className="legal-section__body">
            Welcome to <strong style={{ color: "white" }}>Ultimate Playground</strong> (ultimate-playground.com).
            We respect your privacy and are committed to protecting your personal data.
          </p>
        </div>

        <hr className="legal-divider" />

        <div className="legal-section">
          <h2 className="legal-section__title">1. Information We Collect</h2>
          <div className="legal-section__body">
            <p>We may collect the following types of data:</p>
            <ul>
              <li>Usage data (pages visited, time spent, interactions)</li>
              <li>Device and browser information</li>
              <li>IP address (anonymized where possible)</li>
            </ul>
            <p>If you create an account:</p>
            <ul>
              <li>Email address</li>
              <li>Username</li>
              <li>Game-related data (scores, progress)</li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">2. How We Use Your Data</h2>
          <div className="legal-section__body">
            <p>We use your data to:</p>
            <ul>
              <li>Provide and improve our games and services</li>
              <li>Analyze website traffic and user behavior</li>
              <li>Maintain user accounts and game progress</li>
              <li>Display advertisements</li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">3. Analytics and Advertising</h2>
          <div className="legal-section__body">
            <p>We use third-party services including:</p>
            <ul>
              <li>Google Analytics</li>
              <li>Google Ads</li>
              <li>Vercel (analytics)</li>
            </ul>
            <p>
              These services may collect and process data such as IP address, device
              information, and browsing behavior. Their respective privacy policies govern
              how they handle your data.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">4. Cookies</h2>
          <div className="legal-section__body">
            <p>We use cookies to:</p>
            <ul>
              <li>Ensure proper functionality of the website</li>
              <li>Analyze traffic and performance</li>
              <li>Personalize content and ads</li>
            </ul>
            <p>
              You can accept or refuse cookies via the cookie banner. For more details,
              see our <Link href="/cookies">Cookie Policy</Link>.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">5. Data Sharing</h2>
          <div className="legal-section__body">
            <p>
              We do not sell your personal data. However, data may be processed by the
              third-party services listed in section 3 above.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">6. Data Retention</h2>
          <div className="legal-section__body">
            <p>
              We retain your data only as long as necessary to provide our services or
              comply with legal obligations. You may request deletion of your account and
              associated data at any time.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">7. Your Rights (GDPR)</h2>
          <div className="legal-section__body">
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Request correction or deletion</li>
              <li>Object to data processing</li>
            </ul>
            <p>
              To exercise your rights, contact us at:{" "}
              <a href="mailto:ultimate.playground.contact@gmail.com">
                ultimate.playground.contact@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">8. Security</h2>
          <div className="legal-section__body">
            <p>
              We implement reasonable technical and organizational measures to protect
              your data against unauthorized access, loss, or disclosure.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">9. Updates</h2>
          <div className="legal-section__body">
            <p>
              This policy may be updated at any time. We encourage you to review it
              periodically. Continued use of the site after changes constitutes acceptance
              of the updated policy.
            </p>
          </div>
        </div>

        <hr className="legal-divider" />

        <p className="legal-section__body">
          Questions? <Link href="/contact">Contact us</Link> or email{" "}
          <a href="mailto:ultimate.playground.contact@gmail.com">
            ultimate.playground.contact@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
