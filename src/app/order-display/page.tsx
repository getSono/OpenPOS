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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-red-800 text-white p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Package className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-red-300 to-orange-300 bg-clip-text text-transparent mb-4">OpenPOS</h1>
        <p className="text-2xl opacity-90 font-medium">Order Status Display</p>
        <div className="text-xl mt-6 font-mono bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl inline-block shadow-xl">
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* Ready Orders - Highlighted Section */}
      {readyOrders.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 mb-4 shadow-2xl backdrop-blur-lg">
            <h2 className="text-4xl font-bold text-center mb-8 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              READY FOR PICKUP
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/95 backdrop-blur-lg text-green-800 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-2xl animate-pulse border-2 border-green-200"
                >
                  <div className="text-5xl font-bold mb-3 bg-gradient-to-br from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    #{order.orderNumber}
                  </div>
                  <div className="text-sm opacity-75 font-medium">
                    {formatTime(order.createdAt)}
                  </div>
                  <div className="text-xs mt-3 px-3 py-1 bg-green-100 rounded-full">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preparing Orders */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center mr-4">
              <Clock className="h-6 w-6 text-white" />
            </div>
            PREPARING ({inProgressOrders.length})
          </h2>
          <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
            {inProgressOrders.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Package className="h-8 w-8 text-white/60" />
                </div>
                <p className="text-lg">No orders being prepared</p>
              </div>
            ) : (
              inProgressOrders.map((order) => (
                <Card key={order.id} className="bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-3xl font-bold">#{order.orderNumber}</div>
                        <div className="text-sm opacity-75 font-medium">
                          {formatTime(order.createdAt)} • {getWaitTime(order.createdAt)}m ago
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 px-3 py-1 text-sm font-semibold">
                        {order.items.length} items
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            WAITING ({pendingOrders.length})
          </h2>
          <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-white/60" />
                </div>
                <p className="text-lg">No pending orders</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <Card key={order.id} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-blue-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-3xl font-bold">#{order.orderNumber}</div>
                        <div className="text-sm opacity-75 font-medium">
                          {formatTime(order.createdAt)} • {getWaitTime(order.createdAt)}m ago
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800 px-3 py-1 text-sm font-semibold">
                        {order.items.length} items
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
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
      <div className="mt-10 grid grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center shadow-xl border border-white/20">
          <div className="text-4xl font-bold mb-2">{pendingOrders.length}</div>
          <div className="text-sm opacity-75 font-medium uppercase tracking-wide">Waiting</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center shadow-xl border border-white/20">
          <div className="text-4xl font-bold mb-2">{inProgressOrders.length}</div>
          <div className="text-sm opacity-75 font-medium uppercase tracking-wide">Preparing</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center shadow-xl border border-white/20">
          <div className="text-4xl font-bold mb-2">{readyOrders.length}</div>
          <div className="text-sm opacity-75 font-medium uppercase tracking-wide">Ready</div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-6 right-6 bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3 text-sm font-medium shadow-xl border border-white/20">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Auto-refreshing every 3s</span>
        </div>
      </div>
    </div>
  )
}