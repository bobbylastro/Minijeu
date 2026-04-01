interface FAQItem {
  q: string;
  a: string;
}

/**
 * Renders a visual FAQ accordion + injects FAQPage JSON-LD.
 * Place inside .game-seo-section__inner (dark) or .cat-page__seo (light).
 * Styling is handled by globals.css via parent-context selectors.
 */
export default function FAQ({ items }: { items: FAQItem[] }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map(item => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
      <div className="faq-block">
        <h2>Frequently Asked Questions</h2>
        {items.map((item, i) => (
          <details key={i} className="faq-item">
            <summary className="faq-item__q">{item.q}</summary>
            <p className="faq-item__a">{item.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
