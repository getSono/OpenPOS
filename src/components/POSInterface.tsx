'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import BarcodeScanner from '@/components/BarcodeScanner'
import HandheldScanner from '@/components/HandheldScanner'
import ReceiptModal from '@/components/ReceiptModal'
import { 
  ShoppingCart, 
  Search, 
  ScanLine, 
  User, 
  LogOut,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Monitor,
  Smartphone
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  barcode?: string
  category: { name: string }
  stock: number
}

interface CartItem {
  product: Product
  quantity: number
}

export default function POSInterface() {
  const { user, logout } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showHandheldScanner, setShowHandheldScanner] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    receiptNumber: string;
    orderNumber: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    cashier: string;
    timestamp: string;
  } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  )

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      let newCart
      if (existingItem) {
        newCart = prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        newCart = [...prev, { product, quantity: 1 }]
      }
      
      // Update customer display
      updateCustomerDisplay(newCart, product)
      return newCart
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => {
      const newCart = prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
      updateCustomerDisplay(newCart)
      return newCart
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.product.id !== productId)
      updateCustomerDisplay(newCart)
      return newCart
    })
  }

  const clearCart = () => {
    setCart([])
    updateCustomerDisplay([])
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  // Update customer display with current cart data
  const updateCustomerDisplay = async (cartData: CartItem[], currentItem?: Product) => {
    try {
      const total = cartData.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      const itemCount = cartData.reduce((sum, item) => sum + item.quantity, 0)
      
      const displayData = {
        cart: cartData,
        total,
        itemCount,
        currentItem: currentItem ? {
          name: currentItem.name,
          price: currentItem.price
        } : undefined
      }

      await fetch('/api/customer-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(displayData)
      })
    } catch (error) {
      console.error('Failed to update customer display:', error)
    }
  }

  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      addToCart(product)
      setShowBarcodeScanner(false)
      setShowHandheldScanner(false)
    } else {
      alert(`No product found with barcode: ${barcode}`)
    }
  }

  const handleNFCScanned = (nfcCode: string) => {
    // Handle NFC customer identification or payment
    console.log('NFC scanned:', nfcCode)
    // For now, just close the scanner
    setShowHandheldScanner(false)
    // TODO: Implement customer lookup or payment processing
  }

  const openCustomerDisplay = () => {
    window.open('/customer-display', '_blank', 'width=1200,height=800')
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
          total: calculateTotal(),
        }),
      })

      if (response.ok) {
        const transaction = await response.json()
        
        // Create receipt data
        const receipt = {
          receiptNumber: transaction.receiptNumber,
          orderNumber: transaction.orderNumber,
          items: cart.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            total: item.product.price * item.quantity,
          })),
          subtotal: calculateTotal(),
          tax: 0,
          total: calculateTotal(),
          paymentMethod: 'CASH',
          cashier: user?.name || 'Unknown',
          timestamp: new Date().toLocaleString(),
        }
        
        setReceiptData(receipt)
        setShowReceipt(true)
        clearCart()
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      alert('Checkout failed. Please try again.')
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">OpenPOS</h1>
            <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">Point of Sale System</p>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={openCustomerDisplay}>
              <Monitor className="w-4 h-4 mr-2" />
              Customer Display
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('/handheld', '_blank')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Handheld
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('/worker', '_blank')}
            >
              <User className="w-4 h-4 mr-2" />
              Worker Station
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('/order-display', '_blank')}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Order Display
            </Button>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user?.role}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex lg:hidden items-center space-x-2">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium truncate max-w-20">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Quick Actions */}
        <div className="lg:hidden mt-3 flex gap-2 overflow-x-auto pb-2">
          <Button variant="outline" size="sm" onClick={openCustomerDisplay} className="whitespace-nowrap">
            <Monitor className="w-4 h-4 mr-1" />
            Display
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('/handheld', '_blank')}
            className="whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4 mr-1" />
            Handheld
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('/worker', '_blank')}
            className="whitespace-nowrap"
          >
            <User className="w-4 h-4 mr-1" />
            Worker
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('/order-display', '_blank')}
            className="whitespace-nowrap"
          >
            <Monitor className="w-4 h-4 mr-1" />
            Orders
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Products Section */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="mb-4 lg:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setShowBarcodeScanner(true)} className="flex-1 sm:flex-none">
                  <ScanLine className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Scan</span>
                </Button>
                <Button variant="outline" onClick={() => setShowHandheldScanner(true)} className="flex-1 sm:flex-none">
                  <Smartphone className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Handheld</span>
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow touch-manipulation"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3 lg:p-4">
                    <div className="aspect-square bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-bold text-green-600">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Stock: {product.stock} • {product.category.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section - Mobile Responsive */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l">
          <div className="p-4 lg:p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cart</h2>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm text-gray-600">
                  {cart.reduce((total, item) => total + item.quantity, 0)} items
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto max-h-60 lg:max-h-96">
            {cart.length === 0 ? (
              <div className="p-4 lg:p-6 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="p-3 lg:p-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm flex-1 mr-2 line-clamp-2">{item.product.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                        className="h-8 w-8 p-0 touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="h-8 w-8 p-0 touch-manipulation"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="h-8 w-8 p-0 touch-manipulation"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          ${item.product.price.toFixed(2)} each
                        </p>
                        <p className="font-semibold">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-4 lg:p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full touch-manipulation" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full touch-manipulation" 
                  onClick={clearCart}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Handheld Scanner Modal */}
      <HandheldScanner
        isOpen={showHandheldScanner}
        onClose={() => setShowHandheldScanner(false)}
        onBarcodeScan={handleBarcodeScanned}
        onNFCScan={handleNFCScanned}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receiptData={receiptData || undefined}
      />
    </div>
  )
}