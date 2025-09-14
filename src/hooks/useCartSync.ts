'use client'

import { useState, useEffect, useCallback } from 'react'

interface CartItem {
  productId: string
  quantity: number
  product?: any
}

interface CartSyncData {
  type: string
  cart: CartItem[]
}

export function useCartSync() {
  const [isConnected, setIsConnected] = useState(false)
  const [externalCart, setExternalCart] = useState<CartItem[]>([])

  useEffect(() => {
    const eventSource = new EventSource('/api/cart/sync')

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data: CartSyncData = JSON.parse(event.data)
        if (data.type === 'cart-update') {
          setExternalCart(data.cart)
        }
      } catch (error) {
        console.error('Failed to parse cart sync data:', error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const syncCartAction = useCallback(async (action: string, productId?: string, quantity?: number, product?: any) => {
    try {
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productId, quantity, product })
      })
    } catch (error) {
      console.error('Failed to sync cart action:', error)
    }
  }, [])

  return {
    isConnected,
    externalCart,
    syncCartAction
  }
}