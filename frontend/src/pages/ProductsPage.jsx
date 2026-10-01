import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    const q = searchParams.get('q')
    const url = q ? `/api/search?q=${encodeURIComponent(q)}` : '/api/products'
    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.products) { setProducts(d.products); setFiltered(d.products) }
      })
      .finally(() => setLoading(false))
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) setSearchParams({ q: query })
    else setSearchParams({})
  }

  return (
    <div className="supply-light-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '60px 40px', borderBottom: '1px solid var(--c-border-verylight)' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 20 }}>
          {searchParams.get('q') ? `RESULTS FOR: ${searchParams.get('q')}` : 'ALL PRODUCTS'}
        </h1>
        <form onSubmit={handleSearch} style={{ display: 'flex', maxWidth: 600 }}>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for something specific..."
            style={{ 
              flex: 1, padding: '16px 20px', fontSize: '1rem', 
              border: '1px solid var(--c-border-light)', outline: 'none', background: '#fff' 
            }}
          />
          <button type="submit" style={{ 
            padding: '0 32px', background: 'var(--c-black)', color: '#fff', 
            fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' 
          }}>
            Search
          </button>
        </form>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--c-gray)' }}>Loading data...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--c-gray)' }}>No items found. Try another search.</div>
      ) : (
        <div className="supply-grid-3">
          {filtered.map((p, i) => (
            <ProductCard key={p.id || i} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
