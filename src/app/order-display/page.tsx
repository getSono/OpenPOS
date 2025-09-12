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
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-700 text-white p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-2">OpenPOS</h1>
        <p className="text-xl opacity-90">Order Status Display</p>
        <div className="text-lg mt-4 font-mono">
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
          <div className="bg-green-500 rounded-lg p-6 mb-4">
            <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 mr-3" />
              READY FOR PICKUP
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white text-green-800 rounded-lg p-6 text-center transform hover:scale-105 transition-transform animate-pulse"
                >
                  <div className="text-4xl font-bold mb-2">
                    #{order.orderNumber}
                  </div>
                  <div className="text-sm opacity-75">
                    {formatTime(order.createdAt)}
                  </div>
                  <div className="text-xs mt-2">
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
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-3" />
            PREPARING ({inProgressOrders.length})
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {inProgressOrders.length === 0 ? (
              <div className="text-center py-8 opacity-60">
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p>No orders being prepared</p>
              </div>
            ) : (
              inProgressOrders.map((order) => (
                <Card key={order.id} className="bg-yellow-500 text-yellow-900 border-0">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-2xl font-bold">#{order.orderNumber}</div>
                        <div className="text-sm opacity-75">
                          {formatTime(order.createdAt)} • {getWaitTime(order.createdAt)}m ago
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                        {order.items.length} items
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="opacity-80">
                          {item.quantity}x {item.product.name}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="opacity-60">
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
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Users className="h-6 w-6 mr-3" />
            WAITING ({pendingOrders.length})
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 opacity-60">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>No pending orders</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <Card key={order.id} className="bg-blue-500 text-blue-900 border-0">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-2xl font-bold">#{order.orderNumber}</div>
                        <div className="text-sm opacity-75">
                          {formatTime(order.createdAt)} • {getWaitTime(order.createdAt)}m ago
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                        {order.items.length} items
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="opacity-80">
                          {item.quantity}x {item.product.name}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="opacity-60">
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
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{pendingOrders.length}</div>
          <div className="text-sm opacity-75">Waiting</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{inProgressOrders.length}</div>
          <div className="text-sm opacity-75">Preparing</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{readyOrders.length}</div>
          <div className="text-sm opacity-75">Ready</div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
        Auto-refreshing every 3s
      </div>
    </div>
  )
}