import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCart(data.cart || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addToCart = useCallback(async (product) => {
    setLoading(true)
    try {
      const productName = product.name || product.title || 'Unknown'
      const productPrice = parseFloat(product.price) || 0
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: String(product.id || Math.random()),
          title: productName,
          name: productName,
          price: productPrice,
          image: product.image || '',
          source: product.source || '',
          quantity: 1
        })
      })
      if (res.ok) {
        await fetchCart()
        setDrawerOpen(true)
        return true
      }
      const err = await res.json()
      console.warn('Cart add failed:', err)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
    return false
  }, [fetchCart])

  const removeFromCart = useCallback(async (id) => {
    try {
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      })
      if (res.ok) await fetchCart()
    } catch (e) { console.error(e) }
  }, [fetchCart])

  const clearCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart/clear', { method: 'POST', credentials: 'include' })
      if (res.ok) setCart([])
    } catch (e) { console.error(e) }
  }, [])

  const count = cart.reduce((sum, i) => sum + (i.quantity || 1), 0)
  const subtotal = cart.reduce((sum, i) => sum + (parseFloat(i.price) * (i.quantity || 1)), 0)

  return (
    <CartContext.Provider value={{ cart, count, subtotal, loading, drawerOpen, setDrawerOpen, addToCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
