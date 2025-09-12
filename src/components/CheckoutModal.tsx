'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, CreditCard, DollarSign, Smartphone } from 'lucide-react'

interface CartItem {
  product: {
    id: string
    name: string
    price: number
  }
  quantity: number
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  total: number
  onCheckout: (paymentData: {
    paymentMethod: 'CASH' | 'PAYPAL'
    amountPaid?: number
    changeAmount?: number
  }) => void
}

export default function CheckoutModal({ isOpen, onClose, cart, total, onCheckout }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PAYPAL'>('CASH')
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [showPayPalQR, setShowPayPalQR] = useState(false)

  if (!isOpen) return null

  const changeAmount = paymentMethod === 'CASH' && amountPaid 
    ? Math.max(0, parseFloat(amountPaid) - total)
    : 0

  const canComplete = paymentMethod === 'PAYPAL' || 
    (paymentMethod === 'CASH' && parseFloat(amountPaid) >= total)

  const handleCashPayment = () => {
    if (parseFloat(amountPaid) >= total) {
      onCheckout({
        paymentMethod: 'CASH',
        amountPaid: parseFloat(amountPaid),
        changeAmount
      })
    }
  }

  const handlePayPalPayment = () => {
    setShowPayPalQR(true)
    // Simulate PayPal payment completion after showing QR
    setTimeout(() => {
      onCheckout({
        paymentMethod: 'PAYPAL'
      })
      setShowPayPalQR(false)
    }, 3000)
  }

  const mockQRCode = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><rect x="10" y="10" width="20" height="20" fill="black"/><rect x="40" y="10" width="20" height="20" fill="black"/><rect x="70" y="10" width="20" height="20" fill="black"/><rect x="130" y="10" width="20" height="20" fill="black"/><rect x="160" y="10" width="20" height="20" fill="black"/><rect x="10" y="40" width="20" height="20" fill="black"/><rect x="40" y="40" width="20" height="20" fill="black"/><rect x="70" y="40" width="20" height="20" fill="black"/><rect x="130" y="40" width="20" height="20" fill="black"/><rect x="160" y="40" width="20" height="20" fill="black"/><text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="14" fill="black">PayPal QR</text><text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="12" fill="black">$${total.toFixed(2)}</text></svg>`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Checkout</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 font-semibold">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'CASH' | 'PAYPAL')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="CASH" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cash
                </TabsTrigger>
                <TabsTrigger value="PAYPAL" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  PayPal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="CASH" className="space-y-4">
                <div>
                  <Label htmlFor="amountPaid">Amount Paid</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    min={total}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={`Minimum: $${total.toFixed(2)}`}
                  />
                </div>
                
                {amountPaid && parseFloat(amountPaid) >= total && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-700">
                      <div>Amount Paid: ${parseFloat(amountPaid).toFixed(2)}</div>
                      <div className="font-semibold">Change: ${changeAmount.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleCashPayment} 
                  disabled={!canComplete}
                  className="w-full"
                >
                  Complete Cash Payment
                </Button>
              </TabsContent>

              <TabsContent value="PAYPAL" className="space-y-4">
                {!showPayPalQR ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Customer will scan QR code to pay ${total.toFixed(2)}
                    </p>
                    <Button onClick={handlePayPalPayment} className="w-full">
                      Generate PayPal QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Show this QR code to the customer
                    </p>
                    <div className="flex justify-center mb-4">
                      <img 
                        src={mockQRCode} 
                        alt="PayPal QR Code" 
                        className="w-48 h-48 border rounded-lg"
                      />
                    </div>
                    <p className="text-lg font-semibold">${total.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Waiting for payment...</p>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mt-2"></div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}