"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

const GA_ID = "G-N3EBS9J0WV";
const AW_ID = "AW-XXXXXXXXX"; // À remplacer quand tu actives Google Ads

export default function ConsentScripts() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("cookie_consent") === "accepted") {
      setAccepted(true);
    }

    function onConsentUpdate() {
      if (localStorage.getItem("cookie_consent") === "accepted") {
        setAccepted(true);
      }
    }

    window.addEventListener("consent_update", onConsentUpdate);
    return () => window.removeEventListener("consent_update", onConsentUpdate);
  }, []);

  if (!accepted) return null;

  return (
    <>
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
          gtag('config', '${AW_ID}');
        `}
      </Script>
    </>
  );
}
