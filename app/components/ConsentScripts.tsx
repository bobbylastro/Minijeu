"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

const GA_ID = "G-N3EBS9J0WV";

export default function ConsentScripts() {
  useEffect(() => {
    // Grant analytics consent if already accepted (page reload / revisit)
    if (localStorage.getItem("cookie_consent") === "accepted") {
      window.gtag?.("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
      });
    }

    function onConsentUpdate() {
      if (localStorage.getItem("cookie_consent") === "accepted") {
        window.gtag?.("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "granted",
        });
      }
    }

    window.addEventListener("consent_update", onConsentUpdate);
    return () => window.removeEventListener("consent_update", onConsentUpdate);
  }, []);

  return (
    <>
      {/* Consent Mode v2 — default denied, updated on user accept */}
      <Script id="gtag-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            wait_for_update: 500
          });
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
