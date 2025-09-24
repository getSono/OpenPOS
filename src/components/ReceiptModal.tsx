'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { X, Printer, Download } from 'lucide-react'
import jsPDF from 'jspdf'

interface ReceiptItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface ReceiptSettings {
  businessName: string
  headerText?: string
  footerText: string
  logoUrl?: string
  address?: string
  phone?: string
  email?: string
  website?: string
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
    discount: number
    total: number
    paymentMethod: string
    cashier: string
    timestamp: string
    amountPaid?: number
    changeAmount?: number
    discountCode?: {
      code: string
      name: string
      discountAmount: number
    }
  }
}

export default function ReceiptModal({ isOpen, onClose, receiptData }: ReceiptProps) {
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    businessName: "OpenPOS",
    footerText: "Thank you for shopping with us!"
  })

  // Fetch receipt settings on component mount
  useEffect(() => {
    const fetchReceiptSettings = async () => {
      try {
        const response = await fetch('/api/receipt-settings')
        if (response.ok) {
          const settings = await response.json()
          setReceiptSettings(settings)
        }
      } catch (error) {
        console.error('Error fetching receipt settings:', error)
      }
    }

    if (isOpen) {
      fetchReceiptSettings()
    }
  }, [isOpen])

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
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Thermal receipt size (80mm width)
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    let yPosition = 10

    // Helper function to add centered text
    const addCenteredText = (text: string, fontSize: number, isBold: boolean = false) => {
      pdf.setFontSize(fontSize)
      if (isBold) {
        pdf.setFont('helvetica', 'bold')
      } else {
        pdf.setFont('helvetica', 'normal')
      }
      const textWidth = pdf.getTextWidth(text)
      const x = (pageWidth - textWidth) / 2
      pdf.text(text, x, yPosition)
      yPosition += fontSize * 0.35 + 2
    }

    // Helper function to add left-aligned text
    const addLeftText = (text: string, fontSize: number, isBold: boolean = false) => {
      pdf.setFontSize(fontSize)
      if (isBold) {
        pdf.setFont('helvetica', 'bold')
      } else {
        pdf.setFont('helvetica', 'normal')
      }
      pdf.text(text, 5, yPosition)
      yPosition += fontSize * 0.35 + 1
    }

    // Helper function to add two-column text
    const addTwoColumnText = (leftText: string, rightText: string, fontSize: number = 8) => {
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', 'normal')
      pdf.text(leftText, 5, yPosition)
      const rightTextWidth = pdf.getTextWidth(rightText)
      pdf.text(rightText, pageWidth - 5 - rightTextWidth, yPosition)
      yPosition += fontSize * 0.35 + 1
    }

    // Helper function to add dashed line
    const addDashedLine = () => {
      pdf.setLineWidth(0.1)
      pdf.setLineDashPattern([1, 1], 0)
      pdf.line(5, yPosition, pageWidth - 5, yPosition)
      yPosition += 3
    }

    // Business Name/Header
    addCenteredText(receiptSettings.businessName || 'OpenPOS', 14, true)
    
    if (receiptSettings.headerText) {
      addCenteredText(receiptSettings.headerText, 8)
    }

    if (receiptSettings.address) {
      addCenteredText(receiptSettings.address, 7)
    }
    if (receiptSettings.phone) {
      addCenteredText(receiptSettings.phone, 7)
    }
    if (receiptSettings.email) {
      addCenteredText(receiptSettings.email, 7)
    }

    yPosition += 3
    addDashedLine()

    // Receipt details
    addTwoColumnText('Receipt #:', receiptData.receiptNumber, 8)
    addTwoColumnText('Order #:', receiptData.orderNumber.toString(), 10)
    addTwoColumnText('Date:', receiptData.timestamp, 8)
    addTwoColumnText('Cashier:', receiptData.cashier, 8)

    addDashedLine()

    // Items
    addLeftText('ITEMS:', 9, true)
    receiptData.items.forEach(item => {
      addLeftText(`${item.name}`, 8)
      addTwoColumnText(`  ${item.quantity} x $${item.price.toFixed(2)}`, `$${item.total.toFixed(2)}`, 8)
    })

    addDashedLine()

    // Totals
    addTwoColumnText('Subtotal:', `$${receiptData.subtotal.toFixed(2)}`, 8)
    addTwoColumnText('Tax:', `$${receiptData.tax.toFixed(2)}`, 8)
    
    if (receiptData.discountCode && receiptData.discount > 0) {
      addTwoColumnText(`Discount (${receiptData.discountCode.name}):`, `-$${receiptData.discount.toFixed(2)}`, 8)
    }
    
    addTwoColumnText('TOTAL:', `$${receiptData.total.toFixed(2)}`, 10)

    yPosition += 2
    addTwoColumnText('Payment:', receiptData.paymentMethod, 8)
    
    if (receiptData.paymentMethod === 'CASH' && receiptData.amountPaid) {
      addTwoColumnText('Amount Paid:', `$${receiptData.amountPaid.toFixed(2)}`, 8)
      addTwoColumnText('Change:', `$${(receiptData.changeAmount || 0).toFixed(2)}`, 8)
    }

    yPosition += 5
    addDashedLine()
    
    // Footer
    if (receiptSettings.footerText) {
      addCenteredText(receiptSettings.footerText, 8)
    }
    
    if (receiptSettings.website) {
      addCenteredText(receiptSettings.website, 7)
    }

    // Save the PDF
    pdf.save(`receipt-${receiptData.receiptNumber}.pdf`)
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
              <h2 className="font-bold text-lg">{receiptSettings.businessName || 'OpenPOS'}</h2>
              {receiptSettings.headerText && (
                <p className="text-xs mt-1">{receiptSettings.headerText}</p>
              )}
              {!receiptSettings.headerText && (
                <p className="text-xs">Point of Sale System</p>
              )}
              {receiptSettings.address && (
                <p className="text-xs">{receiptSettings.address}</p>
              )}
              {receiptSettings.phone && (
                <p className="text-xs">{receiptSettings.phone}</p>
              )}
              {receiptSettings.email && (
                <p className="text-xs">{receiptSettings.email}</p>
              )}
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
              {receiptData.discountCode && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({receiptData.discountCode.name}):</span>
                  <span>-${receiptData.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row flex justify-between font-bold text-base">
                <span>TOTAL:</span>
                <span>${receiptData.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span>Payment:</span>
                <span>{receiptData.paymentMethod}</span>
              </div>
              {receiptData.paymentMethod === 'CASH' && receiptData.amountPaid && (
                <>
                  <div className="flex justify-between text-xs">
                    <span>Amount Paid:</span>
                    <span>${receiptData.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span>Change:</span>
                    <span>${(receiptData.changeAmount || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="footer text-center mt-4 text-xs">
              <p>{receiptSettings.footerText || 'Thank you for shopping with us!'}</p>
              {receiptSettings.website && (
                <p className="mt-1">{receiptSettings.website}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}