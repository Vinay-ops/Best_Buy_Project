import React from 'react'

export default function AboutPage() {
  return (
    <div className="supply-light-bg" style={{ minHeight: '100vh' }}>
      <div style={{ padding: '80px 40px', maxWidth: 800 }}>
        <h1 style={{ fontSize: '4rem', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', marginBottom: 40, lineHeight: 1 }}>
          BUILT FOR <br/> BUILDERS.
        </h1>
        <p style={{ fontSize: '1.25rem', lineHeight: 1.6, color: 'var(--c-gray)', marginBottom: 40 }}>
          Shopify Supply is an experiment in extreme minimalism. We wanted to see what happens when you strip away every unnecessary pixel from an e-commerce experience and leave only the raw essentials: the product, the price, and the checkout button.
        </p>
        <div style={{ borderTop: '1px solid var(--c-border-verylight)', paddingTop: 40 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20 }}>NO DISTRACTIONS</h2>
          <p style={{ color: 'var(--c-gray)', lineHeight: 1.6 }}>
            High-contrast. Sharp borders. Monospace figures. Every element exists solely to facilitate the transaction. Welcome to the future of utility-driven design.
          </p>
        </div>
      </div>
    </div>
  )
}
