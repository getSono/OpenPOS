'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { X, Camera } from 'lucide-react'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Camera access denied or not available')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsScanning(false)
    }
  }, [])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim())
      setManualBarcode('')
      onClose()
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Barcode Scanner</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          <div className="space-y-3">
            <h3 className="font-medium">Camera Scanner</h3>
            {!isScanning ? (
              <Button onClick={startCamera} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 bg-gray-100 rounded"
                />
                <Button onClick={stopCamera} variant="outline" className="w-full">
                  Stop Camera
                </Button>
                <p className="text-sm text-gray-600 text-center">
                  Point camera at barcode
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
            <h3 className="font-medium">Enter Barcode Manually</h3>
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode number"
              className="w-full px-3 py-2 border rounded-md"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={!manualBarcode.trim()}>
              Scan Barcode
            </Button>
          </form>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Test barcodes:</p>
            <p>• 1234567890123 (Coca Cola)</p>
            <p>• 1234567890124 (Pepsi)</p>
            <p>• 1234567890125 (Chips)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}