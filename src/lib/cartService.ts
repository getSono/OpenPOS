// Simple in-memory cart state shared between API routes
// In production, this would be in Redis or a database

interface CartItem {
  productId: string
  quantity: number
  product?: any
}

class CartService {
  private static instance: CartService
  private cart: CartItem[] = []
  private sseConnections = new Set<ReadableStreamDefaultController>()

  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService()
    }
    return CartService.instance
  }

  getCart(): CartItem[] {
    return this.cart
  }

  addConnection(controller: ReadableStreamDefaultController) {
    this.sseConnections.add(controller)
  }

  removeConnection(controller: ReadableStreamDefaultController) {
    this.sseConnections.delete(controller)
  }

  addItem(productId: string, quantity: number = 1, product?: any) {
    const existingIndex = this.cart.findIndex(item => item.productId === productId)
    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity += quantity
    } else {
      this.cart.push({ productId, quantity, product })
    }
    this.broadcastUpdate()
  }

  updateItem(productId: string, quantity: number) {
    const index = this.cart.findIndex(item => item.productId === productId)
    if (index >= 0) {
      if (quantity <= 0) {
        this.cart.splice(index, 1)
      } else {
        this.cart[index].quantity = quantity
      }
      this.broadcastUpdate()
    }
  }

  removeItem(productId: string) {
    this.cart = this.cart.filter(item => item.productId !== productId)
    this.broadcastUpdate()
  }

  clearCart() {
    this.cart = []
    this.broadcastUpdate()
  }

  private broadcastUpdate() {
    const message = `data: ${JSON.stringify({ type: 'cart-update', cart: this.cart })}\n\n`
    const encoder = new TextEncoder()
    
    const deadConnections = new Set<ReadableStreamDefaultController>()
    
    for (const controller of this.sseConnections) {
      try {
        controller.enqueue(encoder.encode(message))
      } catch (error) {
        deadConnections.add(controller)
      }
    }
    
    // Remove dead connections
    for (const deadConnection of deadConnections) {
      this.sseConnections.delete(deadConnection)
    }
  }
}

export default CartService