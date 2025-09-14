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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl">
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2">OpenPOS</h1>
          <p className="text-sm sm:text-lg lg:text-xl text-gray-600 font-medium">Customer Display</p>
        </div>

        {/* Current Item Being Scanned */}
        {displayData.currentItem && (
          <Card className="mb-3 sm:mb-4 lg:mb-6 border-0 shadow-2xl bg-white/90 backdrop-blur-lg ring-2 ring-green-500/20 animate-in">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-green-700 mb-1">Just Added</h2>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{displayData.currentItem.name}</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatPrice(displayData.currentItem.price)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Shopping Cart */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Your Items</h2>
                <span className="ml-auto bg-gradient-to-r from-purple-500 to-blue-600 text-white px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                  {displayData.itemCount} {displayData.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              
              {displayData.cart.length === 0 ? (
                <div className="text-center py-8 sm:py-12 lg:py-16 text-gray-500">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
                    <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-300" />
                  </div>
                  <p className="text-base sm:text-lg lg:text-xl font-medium mb-1 sm:mb-2">Your cart is empty</p>
                  <p className="text-sm sm:text-base text-gray-400">Items will appear here as they are scanned</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-[50vh] sm:max-h-[60vh] lg:max-h-96 overflow-y-auto pr-1 sm:pr-2">
                  {displayData.cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-200">
                      <div className="flex-1 pr-2">
                        <p className="font-semibold text-sm sm:text-base lg:text-lg text-gray-800">{item.product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Qty: {item.quantity} × {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base sm:text-lg lg:text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Order Summary</h2>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-sm sm:text-base lg:text-lg text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatPrice(displayData.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base lg:text-lg text-gray-600">
                    <span>Tax:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                </div>
                
                <div className="border-t-2 border-gray-200 pt-3 sm:pt-4">
                  <div className="flex justify-between text-2xl sm:text-3xl lg:text-4xl font-bold">
                    <span className="text-gray-800">Total:</span>
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {formatPrice(displayData.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 lg:mt-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl sm:rounded-2xl border border-purple-200/50">
                <p className="text-center text-purple-800 font-semibold text-sm sm:text-base lg:text-lg">
                  Thank you for shopping with us!
                </p>
                <p className="text-center text-xs sm:text-sm text-purple-600 mt-1 sm:mt-2 font-medium">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 lg:mt-10">
          <div className="inline-flex items-center space-x-2 text-gray-500 bg-white/60 backdrop-blur-sm px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full shadow-lg">
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Customer Display • OpenPOS System</span>
          </div>
        </div>
      </div>
    </div>
  )
}