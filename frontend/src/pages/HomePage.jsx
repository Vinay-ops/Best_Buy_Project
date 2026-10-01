import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { motion } from 'framer-motion'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
}

const photoVariants = (rotate, x, y) => ({
  hidden: { opacity: 0, rotate: 0, x: 0, y: 0, scale: 0.8 },
  visible: { 
    opacity: 1, rotate, x, y, scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100 }
  }
})

const textVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const { addToCart } = useCart()

  useEffect(() => {
    fetch('/api/products?limit=6')
      .then(r => r.json())
      .then(d => {
        if (d.products) setProducts(d.products)
      })
      .catch(console.error)
  }, [])

  return (
    <motion.div initial="hidden" animate="visible">
      {/* ── HERO COLLAGE (Dark Mode) ──────────────────────────────── */}
      <section className="supply-hero">
        <motion.div className="supply-hero-top" variants={fadeUpVariants}>
          <span className="mono uppercase tracking-wider text-xs text-gray">Best Buy Finder</span>
          <span className="mono uppercase tracking-wider text-xs text-gray">Best Prices. Every Day.</span>
          <span className="mono uppercase tracking-wider text-xs text-gray">AI-Powered Price Comparison Engine</span>
        </motion.div>

        <motion.div className="collage-container" variants={containerVariants}>
          {/* Back image */}
          <motion.div className="collage-img" variants={photoVariants(-5, -20, -20)} style={{ zIndex: 1 }}>
            <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400" alt="Apparel" />
          </motion.div>
          {/* Middle image */}
          <motion.div className="collage-img" variants={photoVariants(2, 20, 10)} style={{ zIndex: 2 }}>
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400" alt="Apparel" />
          </motion.div>
          {/* Front image */}
          <motion.div className="collage-img" variants={photoVariants(-2, 0, 40)} style={{ zIndex: 3 }}>
            <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=400" alt="Apparel" />
          </motion.div>

          <motion.h1 className="hero-giant-text" variants={textVariants}>
            <span>PERFORMANCE</span><br/>
            <span style={{ marginLeft: '10%' }}>PACK</span>
          </motion.h1>
        </motion.div>

        <motion.div className="supply-hero-bottom" variants={fadeUpVariants}>
          <div className="mono uppercase tracking-wider text-xs text-gray" style={{ maxWidth: 200, lineHeight: 1.5 }}>
            Find the best price<br/>
            across 40+ retailers<br/>
            powered by best buy finder
          </div>
          <motion.a 
            href="#shop"
            className="mono uppercase tracking-wider text-xs text-gray"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
            animate={{ x: [0, 5, 0] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Scroll {">>>"}
          </motion.a>
        </motion.div>
      </section>

      {/* ── FILTER TABS (Light Mode) ──────────────────────────────── */}
      <section id="shop" className="supply-light-bg" style={{ borderBottom: '1px solid var(--c-border-light)' }}>
        <div className="supply-tabs">
          <button className="tab active">Shop all</button>
          <button className="tab">Tech</button>
          <button className="tab">Apparel</button>
          <button className="tab">POS Hardware</button>
          <button className="tab">Everything else</button>
        </div>
      </section>

      {/* ── PRODUCT GRID (Light Mode) ─────────────────────────────── */}
      <section className="supply-light-bg">
        <div className="supply-grid-3">
          {products.map((p, i) => (
            <motion.div 
              key={p.id || i} 
              className="supply-grid-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }
              }}
            >
              {i === 0 && <div className="badge-sold-out">SOLD OUT</div>}
              
              <div className="card-image-wrap">
                {p.image ? <img src={p.image} alt={p.name} /> : <div className="placeholder-img"></div>}
              </div>

              <div className="card-footer">
                <div className="card-title">{p.name || p.title || 'Product Name'}</div>
                <div className="card-price">USD ${parseFloat(p.price || 99).toFixed(2)}</div>
              </div>
            </motion.div>
          ))}
          {/* Placeholders if not enough products */}
          {products.length < 3 && Array.from({length: 3 - products.length}).map((_, i) => (
             <motion.div 
               key={'ph'+i} 
               className="supply-grid-card"
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
             >
                <div className="card-image-wrap"><div className="placeholder-img"></div></div>
                <div className="card-footer">
                  <div className="card-title">Shopify Item</div>
                  <div className="card-price">USD $129.00</div>
                </div>
             </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER NEWSLETTER (Dark Mode) ─────────────────────────── */}
      <section className="supply-dark-footer">
        <motion.div 
          className="footer-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <h2>Save with Best Buy Finder.</h2>
          <p>Join 50,000+ smart shoppers. Get price drop alerts free.</p>
        </motion.div>
        <motion.div 
          className="footer-right"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form className="footer-form" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Sign up</button>
          </form>
        </motion.div>
      </section>
    </motion.div>
  )
}
