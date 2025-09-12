'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package,
  RefreshCw,
  Settings,
  LogOut
} from 'lucide-react'

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

interface Worker {
  id: string
  name: string
  nfcCode: string
  currentStation?: string
}

export default function WorkerPage() {
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null)
  const [nfcInput, setNfcInput] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const statusColors = {
    PENDING: 'bg-yellow-500',
    IN_PROGRESS: 'bg-blue-500',
    READY: 'bg-green-500',
    COMPLETED: 'bg-gray-500'
  }

  const statusIcons = {
    PENDING: AlertCircle,
    IN_PROGRESS: Clock,
    READY: CheckCircle,
    COMPLETED: CheckCircle
  }

  useEffect(() => {
    if (currentWorker) {
      fetchOrders()
      const interval = setInterval(fetchOrders, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [currentWorker])

  const authenticateWorker = async () => {
    if (!nfcInput) return

    try {
      setLoading(true)
      const response = await fetch('/api/workers/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcCode: nfcInput })
      })

      if (response.ok) {
        const worker = await response.json()
        setCurrentWorker(worker)
        setNfcInput('')
      } else {
        alert('Authentication failed')
      }
    } catch (error) {
      alert('Authentication error')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          workerId: currentWorker?.id 
        })
      })

      if (response.ok) {
        await fetchOrders()
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      alert('Error updating order status')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setCurrentWorker(null)
    setOrders([])
  }

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

  const getTimeSince = (dateString: string) => {
    const now = new Date()
    const orderTime = new Date(dateString)
    const diffMs = now.getTime() - orderTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const hours = Math.floor(diffMins / 60)
    return `${hours}h ${diffMins % 60}m ago`
  }

  if (!currentWorker) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Worker Authentication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">NFC Worker Card</label>
              <div className="flex space-x-2">
                <Input
                  value={nfcInput}
                  onChange={(e) => setNfcInput(e.target.value)}
                  placeholder="Tap NFC card or enter worker code"
                  onKeyPress={(e) => e.key === 'Enter' && authenticateWorker()}
                  className="touch-manipulation"
                />
                <Button 
                  onClick={authenticateWorker} 
                  disabled={!nfcInput || loading}
                  className="touch-manipulation"
                >
                  {loading ? 'Authenticating...' : 'Login'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Test codes: WORKER001, WORKER002, WORKER003
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Worker Station</h1>
              <div className="flex items-center space-x-2">
                <User className="h-4 lg:h-5 w-4 lg:w-5 text-gray-500" />
                <span className="font-medium text-sm lg:text-base">{currentWorker.name}</span>
                {currentWorker.currentStation && (
                  <Badge variant="outline" className="text-xs">{currentWorker.currentStation}</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="text-xs lg:text-sm text-gray-500 text-center sm:text-left">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrders}
                  disabled={loading}
                  className="touch-manipulation"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="touch-manipulation"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 lg:h-auto">
            <TabsTrigger value="pending" className="relative text-xs lg:text-sm touch-manipulation">
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">Pend</span>
              {getOrdersByStatus('PENDING').length > 0 && (
                <Badge className="ml-1 lg:ml-2 bg-yellow-500 text-xs px-1">
                  {getOrdersByStatus('PENDING').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="relative text-xs lg:text-sm touch-manipulation">
              <span className="hidden sm:inline">In Progress</span>
              <span className="sm:hidden">Prog</span>
              {getOrdersByStatus('IN_PROGRESS').length > 0 && (
                <Badge className="ml-1 lg:ml-2 bg-blue-500 text-xs px-1">
                  {getOrdersByStatus('IN_PROGRESS').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative text-xs lg:text-sm touch-manipulation">
              Ready
              {getOrdersByStatus('READY').length > 0 && (
                <Badge className="ml-1 lg:ml-2 bg-green-500 text-xs px-1">
                  {getOrdersByStatus('READY').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs lg:text-sm touch-manipulation">
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">Done</span>
            </TabsTrigger>
          </TabsList>

          {(['pending', 'in-progress', 'ready', 'completed'] as const).map((status) => {
            const statusKey = status.toUpperCase().replace('-', '_') as keyof typeof statusColors
            const statusOrders = getOrdersByStatus(statusKey)
            const StatusIcon = statusIcons[statusKey]

            return (
              <TabsContent key={status} value={status} className="space-y-4">
                {statusOrders.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 lg:py-12 text-center">
                      <Package className="h-8 lg:h-12 w-8 lg:w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No {status.replace('-', ' ')} orders</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {statusOrders.map((order) => (
                      <Card key={order.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base lg:text-lg">
                                Order #{order.orderNumber}
                              </CardTitle>
                              <p className="text-xs lg:text-sm text-gray-500">
                                {formatTime(order.createdAt)} • {getTimeSince(order.createdAt)}
                              </p>
                              <p className="text-xs lg:text-sm text-gray-600 truncate">
                                Cashier: {order.user.name}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <StatusIcon className={`h-4 lg:h-5 w-4 lg:w-5 text-white rounded-full p-1 ${statusColors[statusKey]}`} />
                              <Badge variant="outline" className="text-xs">
                                ${order.total.toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2 max-h-24 overflow-y-auto">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-xs lg:text-sm">
                                <span className="truncate">{item.quantity}x {item.product.name}</span>
                                <span className="flex-shrink-0">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <Separator />
                          
                          <div className="flex space-x-2">
                            {statusKey === 'PENDING' && (
                              <Button
                                className="flex-1 h-10 lg:h-auto text-sm lg:text-base touch-manipulation"
                                onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                                disabled={loading}
                              >
                                Start Working
                              </Button>
                            )}
                            {statusKey === 'IN_PROGRESS' && (
                              <Button
                                className="flex-1 h-10 lg:h-auto text-sm lg:text-base touch-manipulation"
                                onClick={() => updateOrderStatus(order.id, 'READY')}
                                disabled={loading}
                              >
                                Mark Ready
                              </Button>
                            )}
                            {statusKey === 'READY' && (
                              <Button
                                className="flex-1 h-10 lg:h-auto text-sm lg:text-base touch-manipulation"
                                onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                disabled={loading}
                              >
                                Complete Order
                              </Button>
                            )}
                            {statusKey === 'COMPLETED' && (
                              <div className="flex-1 text-center py-2">
                                <CheckCircle className="h-5 w-5 mx-auto text-green-500" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}