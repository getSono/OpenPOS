'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { X, Zap, Smartphone } from 'lucide-react'

interface NFCReaderProps {
  isOpen: boolean
  onClose: () => void
  onNFCRead: (nfcCode: string) => void
}

export default function NFCReader({ isOpen, onClose, onNFCRead }: NFCReaderProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [manualNFC, setManualNFC] = useState('')

  const checkNFCSupport = useCallback(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true)
      return true
    }
    setNfcSupported(false)
    return false
  }, [])

  const startNFCScanning = async () => {
    if (!checkNFCSupport()) {
      alert('NFC is not supported on this device or browser')
      return
    }

    try {
      setIsScanning(true)
      
      // @ts-expect-error - NDEFReader is not fully typed in TypeScript yet
      const ndef = new NDEFReader()
      
      await ndef.scan()
      
      ndef.addEventListener('reading', ({ message }: { message: { records: Array<{ recordType: string; data: ArrayBuffer }> } }) => {
        const decoder = new TextDecoder()
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const nfcCode = decoder.decode(record.data)
            onNFCRead(nfcCode)
            setIsScanning(false)
            onClose()
            return
          }
        }
      })
      
      ndef.addEventListener('readingerror', () => {
        alert('NFC reading error occurred')
        setIsScanning(false)
      })
      
    } catch (error) {
      console.error('NFC scanning error:', error)
      alert('Failed to start NFC scanning. Please check permissions.')
      setIsScanning(false)
    }
  }

  const stopNFCScanning = () => {
    setIsScanning(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualNFC.trim()) {
      onNFCRead(manualNFC.trim())
      setManualNFC('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              NFC Reader
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* NFC Scanner */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center">
              <Smartphone className="w-4 h-4 mr-2" />
              Tap NFC Card/Device
            </h3>
            
            {!isScanning ? (
              <Button 
                onClick={startNFCScanning} 
                className="w-full"
                disabled={!nfcSupported && typeof window !== 'undefined'}
              >
                <Zap className="w-4 h-4 mr-2" />
                Start NFC Scan
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="animate-pulse">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-blue-800 font-medium">Ready to scan</p>
                    <p className="text-sm text-blue-600">Tap your NFC card or device</p>
                  </div>
                </div>
                <Button onClick={stopNFCScanning} variant="outline" className="w-full">
                  Stop Scanning
                </Button>
              </div>
            )}
            
            {!nfcSupported && typeof window !== 'undefined' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  NFC is not supported on this device or browser. Use manual entry below.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Manual Entry */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <h3 className="font-medium">Enter NFC Code Manually</h3>
            <input
              type="text"
              value={manualNFC}
              onChange={(e) => setManualNFC(e.target.value)}
              placeholder="Enter NFC code"
              className="w-full px-3 py-2 border rounded-md"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={!manualNFC.trim()}>
              Use NFC Code
            </Button>
          </form>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Test NFC codes:</p>
            <p>• NFC001 (Admin User)</p>
            <p>• NFC002 (Manager)</p>
            <p>• NFC003 (Cashier)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}