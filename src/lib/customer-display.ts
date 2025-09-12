// Customer display data and broadcast functionality

// Global store for customer display data
export interface DisplayData {
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

// Function to add a connection
export function addConnection(controller: ReadableStreamDefaultController) {
  const connection = { controller }
  connections.add(connection)
  return connection
}

// Function to remove a connection
export function removeConnection(connection: { controller: ReadableStreamDefaultController }) {
  connections.delete(connection)
}

// Function to get current display data
export function getDisplayData(): DisplayData {
  return displayData
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