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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-violet-900 flex items-center justify-center p-4 animate-in">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            OpenPOS
          </h1>
          <p className="text-lg text-muted-foreground">Point of Sale System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-muted-foreground">Please enter your 4-6 digit PIN to continue</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="Enter PIN"
                  className="text-center text-2xl tracking-widest h-12 rounded-xl bg-secondary/50"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in">
                  <p className="text-sm text-destructive text-center flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={pin.length < 4 || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* NFC Button */}
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-xl border-2 hover:bg-accent/50 transition-all duration-200"
              onClick={() => setShowNFCReader(true)}
              disabled={isLoading}
            >
              <Zap className="w-5 h-5 mr-2" />
              Use NFC Card
            </Button>

            {/* Number Pad */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-center text-muted-foreground">Quick Entry</h3>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    size="lg"
                    className="h-14 text-lg font-semibold rounded-xl hover:bg-accent hover:scale-105 transition-all duration-200 touch-friendly"
                    onClick={() => handleNumberClick(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 rounded-xl hover:bg-accent hover:scale-105 transition-all duration-200 touch-friendly"
                  onClick={handleClear}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 text-lg font-semibold rounded-xl hover:bg-accent hover:scale-105 transition-all duration-200 touch-friendly"
                  onClick={() => handleNumberClick('0')}
                >
                  0
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 rounded-xl hover:bg-accent hover:scale-105 transition-all duration-200 touch-friendly"
                  onClick={handleBackspace}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* NFC Info */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
                <CreditCard className="w-4 h-4" />
                <span>NFC authentication available</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Secure Point of Sale System</p>
        </div>
      </div>

      {/* NFC Reader Modal */}
      {showNFCReader && (
        <NFCReader
          isOpen={showNFCReader}
          onClose={() => setShowNFCReader(false)}
          onNFCRead={handleNFCRead}
        />
      )}
    </div>
  )
}