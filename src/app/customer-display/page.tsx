'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart } from 'lucide-react'

interface CartItem {
  product: {
    id: string
    name: string
    price: number
  }
  quantity: number
}

interface DisplayData {
  cart: CartItem[]
  total: number
  itemCount: number
  currentItem?: {
    name: string
    price: number
  }
}

export default function CustomerDisplay() {
  const [displayData, setDisplayData] = useState<DisplayData>({
    cart: [],
    total: 0,
    itemCount: 0
  })
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    // Listen for Server-Sent Events from the main POS terminal
    const eventSource = new EventSource('/api/customer-display/stream')
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setDisplayData(data)
      setLastUpdated(new Date())
    }

    eventSource.onerror = (error) => {
      console.error('Customer display connection error:', error)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">OpenPOS</h1>
          <p className="text-lg sm:text-xl text-gray-600">Customer Display</p>
        </div>

        {/* Current Item Being Scanned */}
        {displayData.currentItem && (
          <Card className="mb-4 lg:mb-6 border-2 border-green-500 shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl lg:text-2xl font-semibold text-green-700">Just Added</h2>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800 break-words">{displayData.currentItem.name}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl lg:text-2xl font-bold text-green-600">
                    {formatPrice(displayData.currentItem.price)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Shopping Cart */}
          <Card className="shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center mb-4">
                <ShoppingCart className="w-5 lg:w-6 h-5 lg:h-6 mr-2 text-blue-600" />
                <h2 className="text-xl lg:text-2xl font-semibold">Your Items</h2>
                <span className="ml-auto bg-blue-600 text-white px-2 lg:px-3 py-1 rounded-full text-sm">
                  {displayData.itemCount} {displayData.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              
              {displayData.cart.length === 0 ? (
                <div className="text-center py-8 lg:py-12 text-gray-500">
                  <ShoppingCart className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg lg:text-xl">Your cart is empty</p>
                  <p className="text-sm lg:text-base">Items will appear here as they are scanned</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 lg:max-h-96 overflow-y-auto">
                  {displayData.cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-base lg:text-lg truncate">{item.product.name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base lg:text-lg">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-semibold mb-4 lg:mb-6">Order Summary</h2>
              
              <div className="space-y-3 lg:space-y-4">
                <div className="flex justify-between text-base lg:text-lg">
                  <span>Subtotal:</span>
                  <span>{formatPrice(displayData.total)}</span>
                </div>
                <div className="flex justify-between text-base lg:text-lg">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <hr className="my-3 lg:my-4" />
                <div className="flex justify-between text-2xl lg:text-3xl font-bold text-blue-600">
                  <span>Total:</span>
                  <span>{formatPrice(displayData.total)}</span>
                </div>
              </div>

              <div className="mt-6 lg:mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-center text-blue-800 font-medium text-base lg:text-lg">
                  Thank you for shopping with us!
                </p>
                <p className="text-center text-sm text-blue-600 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 lg:mt-8 text-gray-500">
          <p className="text-sm">Customer Display • OpenPOS System</p>
        </div>
      </div>
    </div>
  )
}