'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { X, Printer, Download } from 'lucide-react'

interface ReceiptItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface ReceiptProps {
  isOpen: boolean
  onClose: () => void
  receiptData?: {
    receiptNumber: string
    orderNumber: number
    items: ReceiptItem[]
    subtotal: number
    tax: number
    total: number
    paymentMethod: string
    cashier: string
    timestamp: string
  }
}

export default function ReceiptModal({ isOpen, onClose, receiptData }: ReceiptProps) {
  if (!isOpen || !receiptData) return null

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt ${receiptData.receiptNumber}</title>
              <style>
                body { font-family: monospace; font-size: 12px; margin: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total-row { font-weight: bold; margin-top: 10px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleDownload = () => {
    const receiptText = `
OPENPOS RECEIPT
===============
Receipt #: ${receiptData.receiptNumber}
Order #: ${receiptData.orderNumber}
Date: ${receiptData.timestamp}
Cashier: ${receiptData.cashier}

ITEMS:
${receiptData.items.map(item => 
  `${item.name} x${item.quantity} @ $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`
).join('\n')}

===============
Subtotal: $${receiptData.subtotal.toFixed(2)}
Tax: $${receiptData.tax.toFixed(2)}
TOTAL: $${receiptData.total.toFixed(2)}

Payment: ${receiptData.paymentMethod}

Thank you for shopping with us!
Your order number is: ${receiptData.orderNumber}
    `.trim()

    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${receiptData.receiptNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Receipt</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div id="receipt-content" className="receipt bg-white p-4 border rounded-md font-mono text-sm">
            <div className="header text-center mb-4">
              <h2 className="font-bold text-lg">OPENPOS</h2>
              <p className="text-xs">Point of Sale System</p>
            </div>
            
            <div className="receipt-details space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span>{receiptData.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Order #:</span>
                <span className="font-bold text-lg">{receiptData.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{receiptData.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{receiptData.cashier}</span>
              </div>
            </div>

            <div className="line my-3 border-b border-dashed border-gray-400"></div>

            <div className="items space-y-1">
              {receiptData.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      {item.quantity} x ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-medium">
                    ${item.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="line my-3 border-b border-dashed border-gray-400"></div>

            <div className="totals space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${receiptData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${receiptData.tax.toFixed(2)}</span>
              </div>
              <div className="total-row flex justify-between font-bold text-base">
                <span>TOTAL:</span>
                <span>${receiptData.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span>Payment:</span>
                <span>{receiptData.paymentMethod}</span>
              </div>
            </div>

            <div className="footer text-center mt-4 text-xs">
              <p>Thank you for shopping with us!</p>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}