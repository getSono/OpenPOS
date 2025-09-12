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
  LogOut,
  ChefHat
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Worker Station</CardTitle>
            <p className="text-muted-foreground">Authenticate to access the worker dashboard</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">NFC Worker Card</label>
              <div className="flex space-x-3">
                <Input
                  value={nfcInput}
                  onChange={(e) => setNfcInput(e.target.value)}
                  placeholder="Tap NFC card or enter worker code"
                  className="h-12 rounded-xl bg-secondary/50"
                  onKeyPress={(e) => e.key === 'Enter' && authenticateWorker()}
                />
                <Button 
                  onClick={authenticateWorker} 
                  disabled={!nfcInput || loading}
                  size="lg"
                  className="px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Auth...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Test codes: WORKER001, WORKER002, WORKER003
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg shadow-sm border-b dark:bg-gray-900/90 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Worker Station</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kitchen Management System</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">{currentWorker.name}</span>
                  {currentWorker.currentStation && (
                    <Badge variant="outline" className="ml-2">{currentWorker.currentStation}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={loading}
                className="hover:bg-accent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hover:bg-accent">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/50 backdrop-blur-lg dark:bg-gray-800/50">
            <TabsTrigger value="pending" className="relative data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span>Pending</span>
              {getOrdersByStatus('PENDING').length > 0 && (
                <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-xs px-1.5 py-0.5">
                  {getOrdersByStatus('PENDING').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="relative data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span>In Progress</span>
              {getOrdersByStatus('IN_PROGRESS').length > 0 && (
                <Badge className="ml-2 bg-blue-500 hover:bg-blue-600 text-xs px-1.5 py-0.5">
                  {getOrdersByStatus('IN_PROGRESS').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span>Ready</span>
              {getOrdersByStatus('READY').length > 0 && (
                <Badge className="ml-2 bg-green-500 hover:bg-green-600 text-xs px-1.5 py-0.5">
                  {getOrdersByStatus('READY').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Completed
            </TabsTrigger>
          </TabsList>

          {(['pending', 'in-progress', 'ready', 'completed'] as const).map((status) => {
            const statusKey = status.toUpperCase().replace('-', '_') as keyof typeof statusColors
            const statusOrders = getOrdersByStatus(statusKey)
            const StatusIcon = statusIcons[statusKey]

            return (
              <TabsContent key={status} value={status} className="space-y-6">
                {statusOrders.length === 0 ? (
                  <Card className="bg-white/80 backdrop-blur-lg shadow-xl border-0">
                    <CardContent className="py-16 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg">No {status.replace('-', ' ')} orders</p>
                      <p className="text-gray-400 text-sm mt-1">Orders will appear here when available</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {statusOrders.map((order) => (
                      <Card key={order.id} className="bg-white/80 backdrop-blur-lg shadow-xl border-0 hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl flex items-center space-x-2">
                                <span>Order #{order.orderNumber}</span>
                                <div className={`w-3 h-3 rounded-full ${statusColors[statusKey]}`}></div>
                              </CardTitle>
                              <div className="space-y-1 mt-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatTime(order.createdAt)} • {getTimeSince(order.createdAt)}
                                </p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Cashier: {order.user.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColors[statusKey]}`}>
                                <StatusIcon className="h-5 w-5 text-white" />
                              </div>
                              <Badge variant="outline" className="text-sm font-semibold">
                                ${order.total.toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <span className="font-medium">{item.quantity}x {item.product.name}</span>
                                <span className="text-gray-600 dark:text-gray-400">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <Separator />
                          
                          <div className="flex space-x-2">
                            {statusKey === 'PENDING' && (
                              <Button
                                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                                disabled={loading}
                              >
                                Start Working
                              </Button>
                            )}
                            {statusKey === 'IN_PROGRESS' && (
                              <Button
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                onClick={() => updateOrderStatus(order.id, 'READY')}
                                disabled={loading}
                              >
                                Mark Ready
                              </Button>
                            )}
                            {statusKey === 'READY' && (
                              <Button
                                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                                onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                disabled={loading}
                              >
                                Complete Order
                              </Button>
                            )}
                            {statusKey === 'COMPLETED' && (
                              <div className="flex-1 text-center py-3">
                                <div className="inline-flex items-center space-x-2 text-green-600">
                                  <CheckCircle className="h-5 w-5" />
                                  <span className="font-medium">Completed</span>
                                </div>
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