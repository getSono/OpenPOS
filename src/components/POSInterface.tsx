'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
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
  Receipt
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
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
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
        clearCart()
        // TODO: Show receipt
        alert('Transaction completed successfully!')
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      alert('Checkout failed. Please try again.')
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OpenPOS</h1>
            <p className="text-sm text-gray-600">Point of Sale System</p>
          </div>
          <div className="flex items-center space-x-4">
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
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Products Section */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <ScanLine className="w-4 h-4 mr-2" />
                Scan
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                    <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                    <p className="text-lg font-bold text-green-600">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock: {product.stock} • {product.category.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-white border-l">
          <div className="p-6 border-b">
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

          <div className="flex-1 overflow-auto max-h-96">
            {cart.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{item.product.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
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
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
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
            <div className="border-t p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
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
    </div>
  )
}