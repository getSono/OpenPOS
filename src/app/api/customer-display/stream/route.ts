import { NextRequest } from 'next/server'

// Global store for customer display data
interface DisplayData {
  cart: Array<{
    product: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  total: number;
  itemCount: number;
  currentItem?: {
    name: string;
    price: number;
  };
}

let displayData: DisplayData = {
  cart: [],
  total: 0,
  itemCount: 0,
  currentItem: undefined
}

// Store for active connections
const connections = new Set<{
  controller: ReadableStreamDefaultController
}>()

export async function GET(request: NextRequest) {
  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Store the connection
      const connection = { controller }
      connections.add(connection)
      
      // Send initial data
      const data = `data: ${JSON.stringify(displayData)}\n\n`
      controller.enqueue(new TextEncoder().encode(data))
      
      // Clean up when connection closes
      request.signal.addEventListener('abort', () => {
        connections.delete(connection)
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// Function to broadcast updates to all connected clients
export function broadcastUpdate(newData: DisplayData) {
  displayData = newData
  const message = `data: ${JSON.stringify(displayData)}\n\n`
  const encoded = new TextEncoder().encode(message)
  
  connections.forEach(({ controller }) => {
    try {
      controller.enqueue(encoded)
    } catch {
      // Connection might be closed, remove it
      connections.delete({ controller })
    }
  })
}