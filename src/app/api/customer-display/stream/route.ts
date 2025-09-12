import { NextRequest } from 'next/server'
import { getDisplayData, addConnection, removeConnection } from '@/lib/customer-display'

export async function GET(request: NextRequest) {
  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Store the connection
      const connection = addConnection(controller)
      
      // Send initial data
      const displayData = getDisplayData()
      const data = `data: ${JSON.stringify(displayData)}\n\n`
      controller.enqueue(new TextEncoder().encode(data))
      
      // Clean up when connection closes
      request.signal.addEventListener('abort', () => {
        removeConnection(connection)
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

