'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, DollarSign, Ticket, Check, AlertCircle } from 'lucide-react'

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
    discountCode?: {
      id: string
      code: string
      name: string
      discountAmount: number
    }
  }) => void
}

export default function CheckoutModal({ isOpen, onClose, cart, total, onCheckout }: CheckoutModalProps) {
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [discountCode, setDiscountCode] = useState<string>('')
  const [appliedDiscount, setAppliedDiscount] = useState<{
    id: string
    code: string
    name: string
    discountAmount: number
  } | null>(null)
  const [discountError, setDiscountError] = useState<string>('')
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false)

  if (!isOpen) return null

  const discountedTotal = appliedDiscount ? total - appliedDiscount.discountAmount : total
  const changeAmount = amountPaid 
    ? Math.max(0, parseFloat(amountPaid) - discountedTotal)
    : 0

  const canComplete = parseFloat(amountPaid) >= discountedTotal

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return

    setIsValidatingDiscount(true)
    setDiscountError('')

    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim(),
          orderTotal: total
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setAppliedDiscount(data.discountCode)
        setDiscountError('')
      } else {
        setDiscountError(data.error || 'Invalid discount code')
        setAppliedDiscount(null)
      }
    } catch (error) {
      setDiscountError('Failed to validate discount code')
      setAppliedDiscount(null)
    } finally {
      setIsValidatingDiscount(false)
    }
  }

  const removeDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCode('')
    setDiscountError('')
  }

  const handleCashPayment = () => {
    if (parseFloat(amountPaid) >= discountedTotal) {
      onCheckout({
        paymentMethod: 'CASH',
        amountPaid: parseFloat(amountPaid),
        changeAmount,
        discountCode: appliedDiscount || undefined
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
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedDiscount.name}):</span>
                    <span>-${appliedDiscount.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${discountedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Discount Code Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Ticket className="w-4 h-4" />
                Discount Code
              </div>
              
              {!appliedDiscount ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && validateDiscountCode()}
                  />
                  <Button
                    variant="outline"
                    onClick={validateDiscountCode}
                    disabled={!discountCode.trim() || isValidatingDiscount}
                  >
                    {isValidatingDiscount ? 'Validating...' : 'Apply'}
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {appliedDiscount.name} Applied
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeDiscount}
                      className="text-green-700 hover:text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Saved ${appliedDiscount.discountAmount.toFixed(2)}
                  </div>
                </div>
              )}
              
              {discountError && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">{discountError}</span>
                  </div>
                </div>
              )}
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
                  min={discountedTotal}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`Minimum: $${discountedTotal.toFixed(2)}`}
                />
              </div>
              
              {amountPaid && parseFloat(amountPaid) >= discountedTotal && (
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