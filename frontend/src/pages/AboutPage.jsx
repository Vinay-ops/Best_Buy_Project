import React from 'react'

export default function AboutPage() {
  return (
    <div className="supply-light-bg" style={{ minHeight: '100vh' }}>
      <div style={{ padding: '80px 40px', maxWidth: 800 }}>
        <h1 style={{ fontSize: '4rem', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', marginBottom: 40, lineHeight: 1 }}>
          BUILT FOR <br/> SMART<br/>SHOPPERS.
        </h1>
        <p style={{ fontSize: '1.25rem', lineHeight: 1.6, color: 'var(--c-gray)', marginBottom: 40 }}>
          Best Buy Finder is an AI-powered price comparison engine. We scan 40+ major retailers every hour — Amazon, Flipkart, Croma, Reliance Digital and more — so you never overpay again.
        </p>
        <div style={{ borderTop: '1px solid var(--c-border-verylight)', paddingTop: 40, marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20 }}>HOW IT WORKS</h2>
          <p style={{ color: 'var(--c-gray)', lineHeight: 1.6 }}>
            Search any product. Our engine fetches real-time prices from multiple retailers, ranks them by value, and surfaces the best deal instantly. Add to cart and checkout — we handle the rest.
          </p>
        </div>
        <div style={{ borderTop: '1px solid var(--c-border-verylight)', paddingTop: 40 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20 }}>NO HIDDEN FEES</h2>
          <p style={{ color: 'var(--c-gray)', lineHeight: 1.6 }}>
            100% free. No subscription. No markup. We believe transparency is the future of online shopping. Every price you see is the real price.
          </p>
        </div>
      </div>
    </div>
  )
}
