'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { QrCode, Wifi, User, Package, Clock, CheckCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  barcode: string
  stock: number
}

interface User {
  id: string
  name: string
  role: string
  nfcCode: string
}

export default function HandheldPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [nfcInput, setNfcInput] = useState('')
  const [scannedProducts, setScannedProducts] = useState<Product[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [lastAction, setLastAction] = useState('')

  // Simulate device connection
  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Listen for hardware scanner input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && barcodeInput) {
        handleBarcodeSubmit()
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [barcodeInput])

  const authenticateNFC = async () => {
    if (!nfcInput) return

    try {
      const response = await fetch('/api/auth/nfc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcCode: nfcInput })
      })

      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
        setLastAction(`Authenticated: ${user.name}`)
        setNfcInput('')
      } else {
        setLastAction('Authentication failed')
      }
    } catch (error) {
      setLastAction('Authentication error')
    }
  }

  const handleBarcodeSubmit = async () => {
    if (!barcodeInput) return

    setScanning(true)
    try {
      const response = await fetch(`/api/products/barcode/${barcodeInput}`)
      
      if (response.ok) {
        const product = await response.json()
        setScannedProducts(prev => [product, ...prev.slice(0, 9)]) // Keep last 10
        setLastAction(`Scanned: ${product.name}`)
        
        // Add to main POS cart if needed
        await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 1 })
        })
      } else {
        setLastAction('Product not found')
      }
    } catch (error) {
      setLastAction('Scan error')
    }
    
    setBarcodeInput('')
    setScanning(false)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setScannedProducts([])
    setLastAction('Logged out')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="h-6 w-6" />
            <h1 className="text-lg sm:text-xl font-bold">Handheld Scanner</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
            <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
              {isConnected ? 'Connected' : 'Connecting...'}
            </Badge>
          </div>
        </div>

        {/* User Authentication */}
        {!currentUser ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <User className="h-5 w-5" />
                <span>Authentication Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">NFC Authentication</label>
                <div className="flex space-x-2">
                  <Input
                    value={nfcInput}
                    onChange={(e) => setNfcInput(e.target.value)}
                    placeholder="Tap NFC card or enter code"
                    className="bg-gray-800 border-gray-700 touch-manipulation"
                  />
                  <Button onClick={authenticateNFC} disabled={!nfcInput} className="touch-manipulation">
                    Auth
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  Test codes: NFC001 (Admin), NFC002 (Manager), NFC003 (Cashier)
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current User */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <User className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{currentUser.name}</p>
                      <p className="text-sm text-gray-400">{currentUser.role}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="touch-manipulation">
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scanner Interface */}
            <Tabs defaultValue="barcode" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 h-12">
                <TabsTrigger value="barcode" className="touch-manipulation">Barcode</TabsTrigger>
                <TabsTrigger value="nfc" className="touch-manipulation">NFC</TabsTrigger>
              </TabsList>
              
              <TabsContent value="barcode" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <QrCode className="h-5 w-5" />
                      <span>Barcode Scanner</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          placeholder="Scan or enter barcode"
                          className="bg-gray-800 border-gray-700 touch-manipulation h-12"
                          disabled={scanning}
                        />
                        <Button 
                          onClick={handleBarcodeSubmit} 
                          disabled={!barcodeInput || scanning}
                          className="touch-manipulation h-12 px-4"
                        >
                          {scanning ? 'Scanning...' : 'Scan'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Test barcode: 1234567890123
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="nfc" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <Wifi className="h-5 w-5" />
                      <span>NFC Scanner</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-6 lg:py-8">
                      <Wifi className="h-10 lg:h-12 w-10 lg:w-12 mx-auto mb-4 text-blue-500" />
                      <p className="text-gray-400">Ready to scan NFC tags</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Bring NFC tag close to device
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Last Action */}
            {lastAction && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm break-words">{lastAction}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Scans */}
            {scannedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Package className="h-5 w-5" />
                    <span>Recent Scans</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scannedProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between py-2 min-w-0">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-gray-400">${product.price.toFixed(2)}</p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        Stock: {product.stock}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}