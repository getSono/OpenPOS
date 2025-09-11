'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import NFCReader from '@/components/NFCReader'
import { CreditCard, Lock, Zap } from 'lucide-react'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNFCReader, setShowNFCReader] = useState(false)
  const { login, loginWithNFC } = useAuth()

  const handlePinChange = (value: string) => {
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setPin(value)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    setIsLoading(true)
    setError('')

    const success = await login(pin)
    if (!success) {
      setError('Invalid PIN. Please try again.')
    }

    setIsLoading(false)
  }

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num)
      setError('')
    }
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }

  const handleNFCRead = async (nfcCode: string) => {
    setIsLoading(true)
    setError('')

    const success = await loginWithNFC(nfcCode)
    if (!success) {
      setError('Invalid NFC code. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OpenPOS</h1>
          <p className="text-gray-600">Point of Sale System</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Enter PIN</CardTitle>
            <p className="text-sm text-gray-600">Please enter your 4-6 digit PIN</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="Enter PIN"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={pin.length < 4 || isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="flex items-center">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNFCReader(true)}
              disabled={isLoading}
            >
              <Zap className="w-4 h-4 mr-2" />
              Use NFC Card
            </Button>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  className="h-12 text-lg"
                  onClick={() => handleNumberClick(num.toString())}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                className="h-12"
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                className="h-12 text-lg"
                onClick={() => handleNumberClick('0')}
              >
                0
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={handleBackspace}
              >
                ⌫
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CreditCard className="w-4 h-4" />
              <span>NFC authentication available</span>
            </div>
          </CardFooter>
        </Card>

        {/* NFC Reader Modal */}
        <NFCReader
          isOpen={showNFCReader}
          onClose={() => setShowNFCReader(false)}
          onNFCRead={handleNFCRead}
        />
      </div>
    </div>
  )
}