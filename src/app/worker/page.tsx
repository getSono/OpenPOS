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
    PENDING: 'bg-yellow-600',
    IN_PROGRESS: 'bg-blue-700',
    READY: 'bg-green-600',
    COMPLETED: 'bg-gray-700'
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
  <div className="min-h-screen bg-gradient-to-tr from-blue-700 via-indigo-500 to-purple-700 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-3xl border border-gray-300 dark:border-gray-800 bg-white/90 backdrop-blur-xl dark:bg-gray-900/90">
          <CardHeader className="text-center space-y-5">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl">
              <User className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-white text-3xl font-bold">Worker Station</CardTitle>
            <p className="text-gray-600 dark:text-gray-300 text-base">Authentifiziere dich, um das Dashboard zu nutzen</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <label className="text-white text-base font-semibold">NFC Worker Card</label>
              <div className="flex space-x-4">
                <Input
                  value={nfcInput}
                  onChange={(e) => setNfcInput(e.target.value)}
                  placeholder="NFC-Karte scannen oder Code eingeben"
                  className="h-14 rounded-2xl bg-secondary/60 text-lg px-4"
                  onKeyPress={(e) => e.key === 'Enter' && authenticateWorker()}
                />
                <Button 
                  onClick={authenticateWorker} 
                  disabled={!nfcInput || loading}
                  size="lg"
                  className="px-8 rounded-2xl text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                      Auth...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 mt-2">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                  Testcodes: WORKER001, WORKER002, WORKER003
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gradient-to-tr from-blue-700 via-indigo-500 to-purple-700 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg shadow-sm border-b dark:bg-gray-900/90 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg">
                  <ChefHat className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-white">Worker Station</h1>
                  <p className="text-base text-gray-700 dark:text-gray-300">Küchen-Management</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white">{currentWorker.name}</span>
                  {currentWorker.currentStation && (
                    <Badge variant="outline" className="ml-2 text-base px-2 py-1">{currentWorker.currentStation}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-base text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Letztes Update: <span className="font-semibold">{lastUpdate.toLocaleTimeString()}</span></span>
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={fetchOrders}
                disabled={loading}
                className="hover:bg-accent font-bold text-base px-5 py-2"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
              <Button variant="outline" size="lg" onClick={handleLogout} className="hover:bg-accent font-bold text-base px-5 py-2">
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-10 bg-white/70 backdrop-blur-xl dark:bg-gray-800/70 shadow-lg rounded-xl">
            <TabsTrigger value="pending" className="relative data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span className="font-bold text-base">Offen</span>
              {getOrdersByStatus('PENDING').length > 0 && (
                <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-xs px-1.5 py-0.5">
                  {getOrdersByStatus('PENDING').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="relative data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span className="font-bold text-base ">In Bearbeitung</span>
              {getOrdersByStatus('IN_PROGRESS').length > 0 && (
                <Badge className="ml-2 bg-blue-500 hover:bg-blue-600 text-xs px-1.5 py-0.5">
                  {getOrdersByStatus('IN_PROGRESS').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span className="font-bold text-base ">Fertig</span>
              {getOrdersByStatus('READY').length > 0 && (
                <Badge className="ml-2 bg-green-500 hover:bg-green-600 text-xs px-1.5 py-0.5">
                  {getOrdersByStatus('READY').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span className="font-bold text-base ">Abgeschlossen</span>
            </TabsTrigger>
          </TabsList>

          {(['pending', 'in-progress', 'ready', 'completed'] as const).map((status) => {
            const statusKey = status.toUpperCase().replace('-', '_') as keyof typeof statusColors
            const statusOrders = getOrdersByStatus(statusKey)
            const StatusIcon = statusIcons[statusKey]

            return (
              <TabsContent key={status} value={status} className="space-y-6">
                {statusOrders.length === 0 ? (
                  <Card className="bg-white/90 backdrop-blur-xl shadow-2xl border border-gray-200 dark:border-gray-800">
                    <CardContent className="py-20 text-center">
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Package className="h-10 w-10 text-gray-400" />
                      </div>
                      <p className=" text-xl font-bold">Keine {status.replace('-', ' ')} Bestellungen</p>
                      <p className=" text-base mt-2">Bestellungen erscheinen hier, sobald sie verfügbar sind.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {statusOrders.map((order) => (
                      <Card key={order.id} className="bg-white/90 backdrop-blur-xl shadow-2xl border border-gray-200 dark:border-gray-800 hover:shadow-3xl transition-all duration-200 hover:scale-[1.03]">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-2xl flex items-center space-x-3 font-bold text-white">
                                <span>Bestellung #{order.orderNumber}</span>
                                <div className={`w-4 h-4 rounded-full ${statusColors[statusKey]} border-2 border-white dark:border-gray-900 shadow-lg`}></div>
                              </CardTitle>
                              <div className="space-y-2 mt-3">
                                <p className="text-base text-white">
                                  {formatTime(order.createdAt)} • {getTimeSince(order.createdAt)}
                                </p>
                                <p className="text-base font-semibold text-white">
                                  Kassierer: {order.user.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${statusColors[statusKey]} shadow-lg`}>
                                <StatusIcon className="h-6 w-6 text-white" />
                              </div>
                              <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                                €{order.total.toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-base p-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold">
                                <span>{item.quantity}x {item.product.name}</span>
                                <span className="text-white">€{(item.quantity * item.unitPrice).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <Separator />
                          <div className="flex space-x-3">
                            {statusKey === 'PENDING' && (
                              <Button
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg font-bold py-3 rounded-xl shadow-lg"
                                onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                                disabled={loading}
                              >
                                Bearbeitung starten
                              </Button>
                            )}
                            {statusKey === 'IN_PROGRESS' && (
                              <Button
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg font-bold py-3 rounded-xl shadow-lg"
                                onClick={() => updateOrderStatus(order.id, 'READY')}
                                disabled={loading}
                              >
                                Als fertig markieren
                              </Button>
                            )}
                            {statusKey === 'READY' && (
                              <Button
                                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg font-bold py-3 rounded-xl shadow-lg"
                                onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                disabled={loading}
                              >
                                Bestellung abschließen
                              </Button>
                            )}
                            {statusKey === 'COMPLETED' && (
                              <div className="flex-1 text-center py-4">
                                <div className="inline-flex items-center space-x-3 text-white font-bold text-lg">
                                  <CheckCircle className="h-6 w-6" />
                                  <span>Abgeschlossen</span>
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