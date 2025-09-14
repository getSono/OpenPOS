'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { QrCode, Wifi, User, Package, Clock, CheckCircle, Camera, CameraOff } from 'lucide-react'
import { BrowserBarcodeReader } from '@zxing/library'

interface Product {
  id: string
  name: string
  price: number
  barcode: string
  stock: number
}

interface User {
  id: string
  name: string
  role: string
  nfcCode: string
}

export default function HandheldPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [nfcInput, setNfcInput] = useState('')
  const [scannedProducts, setScannedProducts] = useState<Product[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [nfcScanning, setNfcScanning] = useState(false)
  const [lastAction, setLastAction] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraSupported, setCameraSupported] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReader = useRef<BrowserBarcodeReader | null>(null)

  // Initialize barcode reader
  useEffect(() => {
    codeReader.current = new BrowserBarcodeReader()
    return () => {
      if (codeReader.current) {
        codeReader.current.reset()
      }
    }
  }, [])

  // Check camera support on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraSupported(false)
        setLastAction('Camera not supported in this browser')
        return
      }
      
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasCamera = devices.some(device => device.kind === 'videoinput')
        if (!hasCamera) {
          setCameraSupported(false)
          setLastAction('No camera found on this device')
        }
      } catch (error) {
        console.warn('Could not check camera availability:', error)
      }
    }
    
    checkCameraSupport()
  }, [])

  // Simulate device connection
  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Handle barcode detection from camera
  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    if (isScanning || !barcode || barcode.length < 3) return // Prevent multiple rapid scans and invalid barcodes
    
    setIsScanning(true)
    setBarcodeInput(barcode)
    setLastAction(`Camera detected: ${barcode}`)
    
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`)
      
      if (response.ok) {
        const product = await response.json()
        setScannedProducts(prev => [product, ...prev.slice(0, 9)]) // Keep last 10
        setLastAction(`✅ Camera scanned: ${product.name}`)
        
        // Add to main POS cart with complete product data
        const cartResponse = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            productId: product.id, 
            quantity: 1,
            product: product
          })
        })
        
        if (!cartResponse.ok) {
          setLastAction(`⚠️ Product scanned but cart sync failed: ${product.name}`)
        }
      } else {
        setLastAction(`❌ Camera detected barcode: ${barcode} - Product not found`)
      }
    } catch (error) {
      console.error('Camera scan error:', error)
      setLastAction(`❌ Camera scan error for: ${barcode}`)
    }
    
    // Reset scanning state after a longer delay to prevent rapid re-scanning
    setTimeout(() => {
      setIsScanning(false)
      setBarcodeInput('')
    }, 3000) // Increased to 3 seconds to prevent rapid re-scanning of same barcode
  }, [isScanning])

  // Listen for hardware scanner input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && barcodeInput) {
        handleBarcodeSubmit()
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [barcodeInput])

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      // Reset any existing barcode reader
      if (codeReader.current) {
        try {
          codeReader.current.reset()
        } catch (resetError) {
          console.warn('Error resetting barcode reader:', resetError)
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current && codeReader.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video metadata to load before starting detection
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play()
            setIsCameraActive(true)
            setLastAction('Camera started - point at barcode to scan')
            
            // Start barcode detection with better error handling
            try {
              await codeReader.current?.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
                if (result && result.getText()) {
                  handleBarcodeDetected(result.getText())
                }
                // Only log errors that are not "normal" scanning errors
                if (error && !error.message?.includes('No MultiFormat Readers')) {
                  console.debug('Barcode scanning:', error.message)
                }
              })
            } catch (barcodeError) {
              console.error('Barcode detection setup failed:', barcodeError)
              setLastAction('Barcode detection failed - using manual input only')
            }
          } catch (playError) {
            console.error('Video play failed:', playError)
            setLastAction('Camera preview failed to start')
          }
        }
        
        // Handle video loading errors
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error)
          setLastAction('Camera video error occurred')
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      let errorMessage = 'Camera access denied or not available'
      
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device'
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied - please allow camera access'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application'
        }
      }
      
      setLastAction(errorMessage)
      setCameraSupported(false)
    }
  }, [handleBarcodeDetected])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
      setLastAction('Camera stopped')
    }
    
    // Stop barcode reader
    if (codeReader.current) {
      codeReader.current.reset()
    }
    
    setIsScanning(false)
  }, [])

  const authenticateNFC = async () => {
    if (!nfcInput) return

    try {
      const response = await fetch('/api/auth/nfc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcCode: nfcInput })
      })

      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
        setLastAction(`Authenticated: ${user.name}`)
        setNfcInput('')
      } else {
        setLastAction('Authentication failed')
      }
    } catch (error) {
      setLastAction('Authentication error')
    }
  }

  const handleBarcodeSubmit = async () => {
    if (!barcodeInput) return

    setScanning(true)
    try {
      const response = await fetch(`/api/products/barcode/${barcodeInput}`)
      
      if (response.ok) {
        const product = await response.json()
        setScannedProducts(prev => [product, ...prev.slice(0, 9)]) // Keep last 10
        setLastAction(`Scanned: ${product.name}`)
        
        // Add to main POS cart with complete product data
        await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            productId: product.id, 
            quantity: 1,
            product: product
          })
        })
      } else {
        setLastAction('Product not found')
      }
    } catch (error) {
      setLastAction('Scan error')
    }
    
    setBarcodeInput('')
    setScanning(false)
  }

  const handleNFCProductScan = async () => {
    if (!nfcInput) return

    setNfcScanning(true)
    try {
      // NFC product scanning logic - try multiple approaches
      let response;
      let product = null;

      // First, try to find product by the NFC code as barcode
      try {
        response = await fetch(`/api/products/barcode/${nfcInput}`)
        if (response.ok) {
          product = await response.json()
        }
      } catch (error) {
        console.debug('NFC code not found as barcode:', nfcInput)
      }

      // If not found, try mapping NFC codes to known product barcodes
      if (!product) {
        const nfcToProductMap: { [key: string]: string } = {
          'NFC001': '1234567890123', // Maps to Coca Cola
          'NFC002': '1234567890128', // Maps to Energy Bar  
          'NFC003': '1234567890124', // Maps to Pepsi
          'NFCP01': '1234567890123', // Alternative mapping
          'NFCP02': '1234567890128',
          'NFCP03': '1234567890124'
        }

        const mappedBarcode = nfcToProductMap[nfcInput.toUpperCase()]
        if (mappedBarcode) {
          try {
            response = await fetch(`/api/products/barcode/${mappedBarcode}`)
            if (response.ok) {
              product = await response.json()
            }
          } catch (error) {
            console.debug('Mapped barcode not found:', mappedBarcode)
          }
        }
      }

      // If still not found, try finding by product name containing the NFC code
      if (!product) {
        // For demo purposes, create a virtual product for unknown NFC codes
        if (nfcInput.startsWith('NFC') || nfcInput.startsWith('nfc')) {
          product = {
            id: `nfc-${Date.now()}`,
            name: `NFC Product ${nfcInput}`,
            price: 9.99,
            barcode: nfcInput,
            stock: 1,
            category: { name: 'NFC Items' }
          }
        }
      }

      if (product) {
        setScannedProducts(prev => [product, ...prev.slice(0, 9)]) // Keep last 10
        setLastAction(`NFC Scanned: ${product.name}`)
        
        // Add to main POS cart with complete product data
        await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            productId: product.id, 
            quantity: 1,
            product: product
          })
        })
      } else {
        setLastAction(`NFC code ${nfcInput} scanned - no matching product found`)
      }
    } catch (error) {
      console.error('NFC scan error:', error)
      setLastAction('NFC scan error occurred')
    }
    
    setNfcInput('')
    setNfcScanning(false)
  }

  const startNFCScanning = async () => {
    if ('NDEFReader' in window) {
      try {
        setNfcScanning(true)
        setLastAction('Starting NFC scanning...')
        
        // @ts-expect-error - NDEFReader is not fully typed in TypeScript yet
        const ndef = new NDEFReader()
        await ndef.scan()
        
        setLastAction('NFC scanning active - tap an NFC tag')
        
        ndef.addEventListener('reading', ({ message }: { message: { records: Array<{ recordType: string; data: ArrayBuffer }> } }) => {
          const decoder = new TextDecoder()
          for (const record of message.records) {
            if (record.recordType === 'text') {
              const nfcCode = decoder.decode(record.data)
              setNfcInput(nfcCode)
              setLastAction(`NFC tag detected: ${nfcCode}`)
              // Automatically trigger product scan
              setTimeout(() => {
                handleNFCProductScan()
              }, 100)
              return
            }
          }
          setLastAction('NFC tag read but no text data found')
        })
        
        ndef.addEventListener('readingerror', (error: any) => {
          console.error('NFC reading error:', error)
          setLastAction('NFC reading error occurred')
          setNfcScanning(false)
        })
        
        // Auto-stop scanning after 30 seconds
        setTimeout(() => {
          if (nfcScanning) {
            setNfcScanning(false)
            setLastAction('NFC scanning timeout - use manual entry')
          }
        }, 30000)
        
      } catch (error) {
        console.error('NFC scan error:', error)
        let errorMessage = 'Failed to start NFC scanning'
        
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = 'NFC permission denied - please allow NFC access'
          } else if (error.name === 'NotSupportedError') {
            errorMessage = 'NFC not supported on this device'
          }
        }
        
        setLastAction(errorMessage)
        setNfcScanning(false)
      }
    } else {
      setLastAction('NFC not supported on this device - use manual entry')
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setScannedProducts([])
    setLastAction('Logged out')
    stopCamera() // Stop camera when logging out
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="glass-dark rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Handheld Scanner</h1>
                <p className="text-sm text-gray-300">Mobile POS Terminal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
              <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
                {isConnected ? 'Connected' : 'Connecting...'}
              </Badge>
            </div>
          </div>
        </div>

        {/* User Authentication */}
        {!currentUser ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span>Authentication Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-200">NFC Authentication</label>
                <div className="flex space-x-3">
                  <Input
                    value={nfcInput}
                    onChange={(e) => setNfcInput(e.target.value)}
                    placeholder="Tap NFC card or enter code"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-white/50"
                  />
                  <Button 
                    onClick={authenticateNFC} 
                    disabled={!nfcInput}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6"
                  >
                    Auth
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
                  <p className="text-xs text-blue-200">
                    Test codes: NFC001 (Admin), NFC002 (Manager), NFC003 (Cashier)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current User */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{currentUser.name}</p>
                      <p className="text-sm text-gray-300">{currentUser.role}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scanner Interface */}
            <Tabs defaultValue="barcode" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-lg border-white/20">
                <TabsTrigger value="barcode" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  Barcode
                </TabsTrigger>
                <TabsTrigger value="nfc" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  NFC
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="barcode" className="space-y-4 mt-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <QrCode className="h-5 w-5 text-white" />
                      </div>
                      <span>Barcode Scanner</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Camera Scanner */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-200">Camera Scanner</h3>
                        {!isCameraActive ? (
                          <Button 
                            onClick={startCamera} 
                            size="sm"
                            disabled={!cameraSupported}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {cameraSupported ? 'Start Camera' : 'Camera Unavailable'}
                          </Button>
                        ) : (
                          <Button 
                            onClick={stopCamera} 
                            size="sm"
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/20"
                          >
                            <CameraOff className="w-4 h-4 mr-2" />
                            Stop Camera
                          </Button>
                        )}
                      </div>
                      
                      {isCameraActive ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-48 bg-gray-800 rounded-lg border border-white/20 object-cover"
                              onLoadedMetadata={() => {
                                // Ensure video plays when metadata is loaded
                                if (videoRef.current) {
                                  videoRef.current.play().catch(console.warn)
                                }
                              }}
                              onError={(e) => {
                                console.error('Video error:', e)
                                setLastAction('Camera video error - try stopping and starting again')
                              }}
                            />
                            {isScanning && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                                <div className="bg-green-500/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                                  🔍 Scanning...
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-center text-gray-300">
                            {isScanning 
                              ? '🔍 Processing barcode...' 
                              : '📱 Point camera at barcode - automatic detection active'
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-full h-48 bg-gray-800 rounded-lg border border-white/20 flex items-center justify-center">
                            <div className="text-center text-gray-400">
                              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Camera Preview</p>
                              <p className="text-xs">
                                {cameraSupported 
                                  ? 'Click "Start Camera" to begin scanning' 
                                  : 'Camera not available on this device'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
                            <p className="text-xs text-blue-200">
                              📱 Camera requires HTTPS or localhost. Use a mobile device for best barcode scanning experience.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manual Input */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-200">Manual Entry</h3>
                      <div className="flex space-x-3">
                        <Input
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          placeholder="Scan or enter barcode"
                          className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-white/50"
                          disabled={scanning}
                        />
                        <Button 
                          onClick={handleBarcodeSubmit} 
                          disabled={!barcodeInput || scanning}
                          size="lg"
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6"
                        >
                          {scanning ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Scan...
                            </>
                          ) : (
                            'Scan'
                          )}
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
                        <p className="text-xs text-blue-200">
                          Test barcode: 1234567890123
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="nfc" className="space-y-4 mt-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Wifi className="h-5 w-5 text-white" />
                      </div>
                      <span>NFC Product Scanner</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <Input
                          value={nfcInput}
                          onChange={(e) => setNfcInput(e.target.value)}
                          placeholder="Tap NFC tag or enter code"
                          className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-white/50"
                          disabled={nfcScanning}
                        />
                        <Button 
                          onClick={handleNFCProductScan} 
                          disabled={!nfcInput || nfcScanning}
                          size="lg"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6"
                        >
                          {nfcScanning ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Scan...
                            </>
                          ) : (
                            'Scan'
                          )}
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-gray-300 text-sm mb-3">Or use hardware NFC scanner</p>
                        <Button 
                          onClick={startNFCScanning}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/20"
                          disabled={nfcScanning}
                        >
                          <Wifi className="w-4 h-4 mr-2" />
                          {nfcScanning ? 'Scanning...' : 'Start NFC Scan'}
                        </Button>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-green-500/20 border border-green-400/30">
                        <p className="text-xs text-green-200 mb-1">
                          <strong>Test NFC product codes:</strong>
                        </p>
                        <p className="text-xs text-green-200">
                          • NFC001 → Coca Cola 330ml ($1.50)<br/>
                          • NFC002 → Energy Bar ($3.50)<br/>
                          • NFC003 → Pepsi 330ml ($1.45)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Last Action */}
            {lastAction && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl animate-in">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-white font-medium">{lastAction}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Scans */}
            {scannedProducts.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <span>Recent Scans</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scannedProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/10 border border-white/20">
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-sm text-gray-300">${product.price.toFixed(2)}</p>
                      </div>
                      <Badge variant="outline" className="border-white/30 text-white">
                        Stock: {product.stock}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}