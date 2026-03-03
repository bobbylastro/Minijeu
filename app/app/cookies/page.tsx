import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Ultimate Playground uses cookies and how to manage your preferences.",
  robots: { index: false, follow: false },
};

export default function CookiesPage() {
  return (
    <div className="legal-page">
      <div className="glow-orb glow-orb--purple" />
      <div className="glow-orb glow-orb--orange" />
      <div className="legal-card">
        <span className="legal-card__badge">Legal</span>
        <h1 className="legal-card__title">Cookie Policy</h1>
        <p className="legal-card__meta">Last updated: March 3, 2026</p>

        <div className="legal-section">
          <p className="legal-section__body">
            This Cookie Policy explains how{" "}
            <strong style={{ color: "white" }}>Ultimate Playground</strong> (ultimate-playground.com)
            uses cookies and similar technologies when you visit our website.
          </p>
        </div>

        <hr className="legal-divider" />

        <div className="legal-section">
          <h2 className="legal-section__title">1. What Are Cookies?</h2>
          <div className="legal-section__body">
            <p>
              Cookies are small text files stored on your device when you visit a website.
              They help websites remember information about your visit, such as your
              preferences or consent choices, so you don't have to re-enter them each time.
            </p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">2. Essential Cookies</h2>
          <div className="legal-section__body">
            <p>
              These cookies are always active and are strictly necessary for the website to
              function. They cannot be disabled.
            </p>
            <ul>
              <li>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>cookie_consent</strong> —
                Stores your cookie preference (accepted / refused). Expires: never (localStorage).
              </li>
              <li>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>Authentication session</strong> —
                Keeps you logged in during your session (if applicable).
              </li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">3. Analytics Cookies</h2>
          <div className="legal-section__body">
            <p>
              These cookies are only loaded if you have accepted non-essential cookies.
              They help us understand how visitors interact with the website.
            </p>
            <ul>
              <li>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>Google Analytics (GA4)</strong> —
                Collects anonymized usage data (pages visited, session duration, device
                information). Data is processed by Google. See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google's Privacy Policy
                </a>
                .
              </li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">4. Advertising Cookies</h2>
          <div className="legal-section__body">
            <p>
              These cookies are only loaded if you have accepted non-essential cookies.
              They allow us to show relevant advertisements and measure their performance.
            </p>
            <ul>
              <li>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>Google Ads</strong> —
                Used to display personalized ads and track conversions. Data is processed
                by Google. See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google's Privacy Policy
                </a>
                .
              </li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-section__title">5. How to Manage Your Preferences</h2>
          <div className="legal-section__body">
            <p>
              You can change your cookie preference at any time by clearing your browser's
              local storage and reloading the page — the cookie banner will reappear.
            </p>
            <p>You can also manage or disable cookies directly in your browser settings:</p>
            <ul>
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/en-us/105082" target="_blank" rel="noopener noreferrer">
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p>
              Note that disabling cookies may affect some features of the website.
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
