'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, DollarSign } from 'lucide-react'

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
    paymentMethod: 'CASH'
    amountPaid?: number
    changeAmount?: number
  }) => void
}

export default function CheckoutModal({ isOpen, onClose, cart, total, onCheckout }: CheckoutModalProps) {
  const [amountPaid, setAmountPaid] = useState<string>('')

  if (!isOpen) return null

  const changeAmount = amountPaid 
    ? Math.max(0, parseFloat(amountPaid) - total)
    : 0

  const canComplete = parseFloat(amountPaid) >= total

  const handleCashPayment = () => {
    if (parseFloat(amountPaid) >= total) {
      onCheckout({
        paymentMethod: 'CASH',
        amountPaid: parseFloat(amountPaid),
        changeAmount
      })
    }
  }

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

            {/* Payment Method - Cash Only */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-semibold">
                <DollarSign className="w-5 h-5" />
                Cash Payment
              </div>

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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}