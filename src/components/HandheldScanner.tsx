'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { X, ScanLine, Zap, Keyboard, Wifi } from 'lucide-react'

interface HandheldScannerProps {
  isOpen: boolean
  onClose: () => void
  onBarcodeScan: (barcode: string) => void
  onNFCScan: (nfcCode: string) => void
}

export default function HandheldScanner({ 
  isOpen, 
  onClose, 
  onBarcodeScan, 
  onNFCScan 
}: HandheldScannerProps) {
  const [scanMode, setScanMode] = useState<'barcode' | 'nfc'>('barcode')
  const [isConnected, setIsConnected] = useState(false)
  const [lastScan, setLastScan] = useState<{ type: string, value: string, time: Date } | null>(null)
  const [manualInput, setManualInput] = useState('')

  // Simulate handheld device connection
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsConnected(true), 1000)
      return () => clearTimeout(timer)
    } else {
      setIsConnected(false)
    }
  }, [isOpen])

  // Listen for keyboard input from hardware barcode scanners
  useEffect(() => {
    if (!isOpen || scanMode !== 'barcode') return

    let scanBuffer = ''
    let scanTimeout: NodeJS.Timeout

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement) return

      // Check for Enter key (barcode scanners typically end with Enter)
      if (event.key === 'Enter' && scanBuffer.length > 0) {
        event.preventDefault()
        onBarcodeScan(scanBuffer)
        setLastScan({ type: 'Barcode', value: scanBuffer, time: new Date() })
        scanBuffer = ''
        return
      }

      // Add to scan buffer if it's a valid character
      if (event.key.length === 1) {
        scanBuffer += event.key
        
        // Clear buffer after 100ms of inactivity (typical for hardware scanners)
        clearTimeout(scanTimeout)
        scanTimeout = setTimeout(() => {
          scanBuffer = ''
        }, 100)
      }
    }

    document.addEventListener('keypress', handleKeyPress)
    return () => {
      document.removeEventListener('keypress', handleKeyPress)
      clearTimeout(scanTimeout)
    }
  }, [isOpen, scanMode, onBarcodeScan])

  // Simulate NFC scanning
  const handleNFCScan = async () => {
    if ('NDEFReader' in window) {
      try {
        // @ts-expect-error - NDEFReader is not fully typed in TypeScript yet
        const ndef = new NDEFReader()
        await ndef.scan()
        
        ndef.addEventListener('reading', ({ message }: { message: { records: Array<{ recordType: string; data: ArrayBuffer }> } }) => {
          const decoder = new TextDecoder()
          for (const record of message.records) {
            if (record.recordType === 'text') {
              const nfcCode = decoder.decode(record.data)
              onNFCScan(nfcCode)
              setLastScan({ type: 'NFC', value: nfcCode, time: new Date() })
              return
            }
          }
        })
      } catch (error) {
        console.error('NFC error:', error)
        alert('NFC scanning failed. Please try manual entry.')
      }
    } else {
      alert('NFC not supported. Please use manual entry.')
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      if (scanMode === 'barcode') {
        onBarcodeScan(manualInput.trim())
        setLastScan({ type: 'Barcode (Manual)', value: manualInput.trim(), time: new Date() })
      } else {
        onNFCScan(manualInput.trim())
        setLastScan({ type: 'NFC (Manual)', value: manualInput.trim(), time: new Date() })
      }
      setManualInput('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ScanLine className="w-5 h-5 mr-2" />
              Handheld Scanner
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Device Status:</span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
              <Wifi className={`w-4 h-4 ml-2 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </div>

          {/* Scan Mode Toggle */}
          <div className="flex space-x-2">
            <Button
              variant={scanMode === 'barcode' ? 'default' : 'outline'}
              onClick={() => setScanMode('barcode')}
              className="flex-1"
            >
              <ScanLine className="w-4 h-4 mr-2" />
              Barcode
            </Button>
            <Button
              variant={scanMode === 'nfc' ? 'default' : 'outline'}
              onClick={() => setScanMode('nfc')}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              NFC
            </Button>
          </div>

          {/* Barcode Mode */}
          {scanMode === 'barcode' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ScanLine className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="font-medium text-blue-800">Barcode Scanner Ready</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Use your handheld scanner or scan manually below
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  Hardware scanners will automatically input data
                </div>
              </div>
            </div>
          )}

          {/* NFC Mode */}
          {scanMode === 'nfc' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 mr-2 text-purple-600" />
                  <h3 className="font-medium text-purple-800">NFC Reader Ready</h3>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Tap NFC card or device, or use manual entry below
                </p>
                <Button onClick={handleNFCScan} className="w-full" disabled={!isConnected}>
                  <Zap className="w-4 h-4 mr-2" />
                  Start NFC Scan
                </Button>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          <div className="space-y-3">
            <div className="flex items-center">
              <Keyboard className="w-4 h-4 mr-2" />
              <h3 className="font-medium">Manual Entry</h3>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={scanMode === 'barcode' ? 'Enter barcode manually' : 'Enter NFC code manually'}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!isConnected}
              />
              <Button type="submit" className="w-full" disabled={!manualInput.trim() || !isConnected}>
                Submit {scanMode === 'barcode' ? 'Barcode' : 'NFC Code'}
              </Button>
            </form>
          </div>

          {/* Last Scan */}
          {lastScan && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="font-medium text-green-800 mb-1">Last Scan</h4>
              <p className="text-sm text-green-700">
                <strong>{lastScan.type}:</strong> {lastScan.value}
              </p>
              <p className="text-xs text-green-600">
                {lastScan.time.toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Test Data */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Test {scanMode === 'barcode' ? 'Barcodes' : 'NFC Codes'}:</strong></p>
            {scanMode === 'barcode' ? (
              <>
                <p>• 1234567890123 (Coca Cola)</p>
                <p>• 1234567890124 (Pepsi)</p>
                <p>• 1234567890125 (Chips)</p>
              </>
            ) : (
              <>
                <p>• NFC001 (Admin User)</p>
                <p>• NFC002 (Manager)</p>
                <p>• NFC003 (Cashier)</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}