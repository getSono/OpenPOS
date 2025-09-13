'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useMode } from '@/contexts/ModeContext'
import BarcodeScanner from '@/components/BarcodeScanner'
import HandheldScanner from '@/components/HandheldScanner'
import ReceiptModal from '@/components/ReceiptModal'
import CheckoutModal from '@/components/CheckoutModal'
import SettingsPage from '@/components/SettingsPage'
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
  Smartphone,
  Settings,
  ChefHat,
  ToggleLeft,
  ToggleRight
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
  const { mode, toggleMode } = useMode()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showHandheldScanner, setShowHandheldScanner] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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
    discount: number;
    total: number;
    paymentMethod: string;
    cashier: string;
    timestamp: string;
    amountPaid?: number;
    changeAmount?: number;
    discountCode?: {
      code: string;
      name: string;
      discountAmount: number;
    };
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

  const handleCheckout = async (paymentData: {
    paymentMethod: 'CASH'
    amountPaid?: number
    changeAmount?: number
    discountCode?: {
      id: string
      code: string
      name: string
      discountAmount: number
    }
  }) => {
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
          paymentMethod: paymentData.paymentMethod,
          amountPaid: paymentData.amountPaid,
          changeAmount: paymentData.changeAmount,
          discountCode: paymentData.discountCode,
        }),
      })

      if (response.ok) {
        const transaction = await response.json()
        
        // Create receipt data
        const originalTotal = calculateTotal()
        const discountAmount = paymentData.discountCode?.discountAmount || 0
        const finalTotal = originalTotal - discountAmount
        
        const receipt = {
          receiptNumber: transaction.receiptNumber,
          orderNumber: transaction.orderNumber,
          items: cart.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            total: item.product.price * item.quantity,
          })),
          subtotal: originalTotal,
          tax: 0,
          discount: discountAmount,
          total: finalTotal,
          paymentMethod: paymentData.paymentMethod,
          cashier: user?.name || 'Unknown',
          timestamp: new Date().toLocaleString(),
          amountPaid: paymentData.amountPaid,
          changeAmount: paymentData.changeAmount,
          discountCode: paymentData.discountCode ? {
            code: paymentData.discountCode.code,
            name: paymentData.discountCode.name,
            discountAmount: paymentData.discountCode.discountAmount
          } : undefined,
        }
        
        setReceiptData(receipt)
        setShowReceipt(true)
        setShowCheckout(false)
        clearCart()
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      alert('Checkout failed. Please try again.')
    }
  }

  const openCheckout = () => {
    if (cart.length === 0) return
    setShowCheckout(true)
  }

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-white/50 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">OpenPOS</h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Point of Sale System</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Badge variant={mode === 'kitchen' ? 'default' : 'outline'} className={mode === 'kitchen' ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white' : ''}>
                {mode === 'kitchen' ? <ChefHat className="w-3 h-3 mr-1" /> : null}
                {mode === 'kitchen' ? 'Kitchen Mode' : 'Normal Mode'}
              </Badge>
              <Button variant="outline" size="sm" onClick={toggleMode} className="hover:bg-purple-50">
                {mode === 'normal' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="hover:bg-purple-50">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={openCustomerDisplay} className="hover:bg-blue-50">
              <Monitor className="w-4 h-4 mr-2" />
              Customer Display
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('/handheld', '_blank')}
              className="hover:bg-indigo-50"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Handheld
            </Button>
            {mode === 'kitchen' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/worker', '_blank')}
                className="hover:bg-green-50"
              >
                <User className="w-4 h-4 mr-2" />
                Worker Station
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('/order-display', '_blank')}
              className="hover:bg-red-50"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Order Display
            </Button>
            <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200/50">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full ml-2 font-medium">
                  {user?.role}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="hover:bg-red-50 text-red-600 border-red-200">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex lg:hidden items-center justify-between w-full sm:w-auto gap-2">
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="hover:bg-purple-50 px-2">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={openCustomerDisplay} className="hover:bg-blue-50 px-2">
                <Monitor className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/handheld', '_blank')}
                className="hover:bg-indigo-50 px-2"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/order-display', '_blank')}
                className="hover:bg-red-50 px-2"
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-2 py-1 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200/50">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-md flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs font-semibold text-gray-800">{user?.name}</span>
                  <span className="text-xs text-purple-600 bg-purple-100 px-1 py-0.5 rounded ml-1 font-medium">
                    {user?.role}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="hover:bg-red-50 text-red-600 border-red-200 px-2">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Products Section */}
        <div className="flex-1 p-3 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-12 rounded-xl bg-white/80 backdrop-blur-sm border-purple-200/50 focus:border-purple-400 shadow-lg text-sm sm:text-base"
                />
              </div>
              <div className="flex space-x-2 sm:space-x-4">
                <Button variant="outline" onClick={() => setShowBarcodeScanner(true)} className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-blue-50 border-blue-200/50 flex-1 sm:flex-none">
                  <ScanLine className="w-4 h-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Scan</span>
                </Button>
                <Button variant="outline" onClick={() => setShowHandheldScanner(true)} className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-purple-50 border-purple-200/50 flex-1 sm:flex-none">
                  <Smartphone className="w-4 h-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Handheld</span>
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/90 backdrop-blur-lg border-0 shadow-xl group"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3 sm:p-6">
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 flex items-center justify-center group-hover:from-purple-50 group-hover:to-blue-50 transition-all duration-300">
                      <span className="text-gray-400 text-xs sm:text-sm font-medium">No Image</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 group-hover:text-purple-700 transition-colors text-sm sm:text-base">{product.name}</h3>
                    <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      ${product.price.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">Stock: {product.stock}</span>
                      <span className="text-purple-600 bg-purple-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">{product.category.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 bg-white/90 backdrop-blur-lg border-t lg:border-t-0 lg:border-l border-white/50 shadow-2xl">
          <div className="p-3 sm:p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Cart</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-gray-600 bg-gradient-to-r from-purple-50 to-blue-50 px-2 sm:px-3 py-1 rounded-full font-medium">
                  {cart.reduce((total, item) => total + item.quantity, 0)} items
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto max-h-64 sm:max-h-96">
            {cart.length === 0 ? (
              <div className="p-4 sm:p-8 text-center text-gray-500">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                </div>
                <p className="font-medium text-sm sm:text-base">Your cart is empty</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Add products to get started</p>
              </div>
            ) : (
              <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-100/50 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="font-semibold text-gray-800 text-xs sm:text-sm pr-2">{item.product.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                        className="hover:bg-red-100 hover:text-red-600 h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-50 hover:border-red-200"
                        >
                          <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-semibold text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-green-50 hover:border-green-200"
                        >
                          <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          ${item.product.price.toFixed(2)} each
                        </p>
                        <p className="font-bold text-purple-700 text-sm">
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
            <div className="border-t border-gray-200/50 p-3 sm:p-6 space-y-3 sm:space-y-6 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-lg sm:text-2xl font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white h-10 sm:h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
                  size="lg"
                  onClick={openCheckout}
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-10 sm:h-12 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600" 
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

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart}
        total={calculateTotal()}
        onCheckout={handleCheckout}
      />
    </div>
  )
}