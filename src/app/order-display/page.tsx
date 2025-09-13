'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, Package, Users } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product: {
    name: string
    description?: string
  }
}

interface Order {
  id: string
  orderNumber: number
  total: number
  orderStatus: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED'
  createdAt: string
  items: OrderItem[]
  user: {
    name: string
  }
}

export default function OrderDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    // Fetch orders
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders')
        if (response.ok) {
          const data = await response.json()
          setOrders(data.filter((order: Order) => 
            ['PENDING', 'IN_PROGRESS', 'READY'].includes(order.orderStatus)
          ))
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 3000) // Refresh every 3 seconds

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(timeInterval)
    }
  }, [])

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.orderStatus === status)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getWaitTime = (dateString: string) => {
    const now = new Date()
    const orderTime = new Date(dateString)
    const diffMs = now.getTime() - orderTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    return diffMins
  }

  const pendingOrders = getOrdersByStatus('PENDING')
  const inProgressOrders = getOrdersByStatus('IN_PROGRESS')
  const readyOrders = getOrdersByStatus('READY')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-red-800 text-white p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 lg:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6 shadow-2xl">
          <Package className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white" />
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-red-300 to-orange-300 bg-clip-text text-transparent mb-2 sm:mb-3 lg:mb-4">OpenPOS</h1>
        <p className="text-sm sm:text-lg lg:text-2xl opacity-90 font-medium">Order Status Display</p>
        <div className="text-sm sm:text-lg lg:text-xl mt-3 sm:mt-4 lg:mt-6 font-mono bg-white/10 backdrop-blur-sm px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-xl sm:rounded-2xl inline-block shadow-xl">
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* Ready Orders - Highlighted Section */}
      {readyOrders.length > 0 && (
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 shadow-2xl backdrop-blur-lg">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row items-center justify-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              READY FOR PICKUP
            </h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/95 backdrop-blur-lg text-green-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-2xl animate-pulse border-2 border-green-200"
                >
                  <div className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-br from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    #{order.orderNumber}
                  </div>
                  <div className="text-xs sm:text-sm opacity-75 font-medium">
                    {formatTime(order.createdAt)}
                  </div>
                  <div className="text-xs mt-2 sm:mt-3 px-2 sm:px-3 py-1 bg-green-100 rounded-full">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Preparing Orders */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/20">
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 flex items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
              <Clock className="h-3 w-3 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            PREPARING ({inProgressOrders.length})
          </h2>
          <div className="space-y-3 sm:space-y-4 lg:space-y-6 max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2">
            {inProgressOrders.length === 0 ? (
              <div className="text-center py-6 sm:py-8 lg:py-12 opacity-60">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
                  <Package className="h-5 w-5 sm:h-6 w-6 lg:h-8 lg:w-8 text-white/60" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg">No orders being prepared</p>
              </div>
            ) : (
              inProgressOrders.map((order) => (
                <Card key={order.id} className="bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
                      <div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold">#{order.orderNumber}</div>
                        <div className="text-xs sm:text-sm opacity-75 font-medium">
                          {formatTime(order.createdAt)} • {getWaitTime(order.createdAt)}m ago
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold">
                        {order.items.length} items
                      </Badge>
                    </div>
                    <div className="text-xs sm:text-sm space-y-1">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="opacity-80 font-medium">
                          {item.quantity}x {item.product.name}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="opacity-60 font-medium">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/20">
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 flex items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
              <Users className="h-3 w-3 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            WAITING ({pendingOrders.length})
          </h2>
          <div className="space-y-3 sm:space-y-4 lg:space-y-6 max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-6 sm:py-8 lg:py-12 opacity-60">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
                  <Clock className="h-5 w-5 sm:h-6 w-6 lg:h-8 lg:w-8 text-white/60" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg">No pending orders</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <Card key={order.id} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-blue-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
                      <div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold">#{order.orderNumber}</div>
                        <div className="text-xs sm:text-sm opacity-75 font-medium">
                          {formatTime(order.createdAt)} • {getWaitTime(order.createdAt)}m ago
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold">
                        {order.items.length} items
                      </Badge>
                    </div>
                    <div className="text-xs sm:text-sm space-y-1">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="opacity-80 font-medium">
                          {item.quantity}x {item.product.name}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="opacity-60 font-medium">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 sm:mt-8 lg:mt-10 grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center shadow-xl border border-white/20">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{pendingOrders.length}</div>
          <div className="text-xs sm:text-sm opacity-75 font-medium uppercase tracking-wide">Waiting</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center shadow-xl border border-white/20">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{inProgressOrders.length}</div>
          <div className="text-xs sm:text-sm opacity-75 font-medium uppercase tracking-wide">Preparing</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center shadow-xl border border-white/20">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{readyOrders.length}</div>
          <div className="text-xs sm:text-sm opacity-75 font-medium uppercase tracking-wide">Ready</div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6 bg-white/20 backdrop-blur-lg rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-medium shadow-xl border border-white/20">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">Auto-refreshing every 3s</span>
          <span className="sm:hidden">Auto-refresh</span>
        </div>
      </div>
    </div>
  )
}