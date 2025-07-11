interface QueryResult {
  success: boolean;
  data: Record<string, unknown>[];
  executionTime: number;
  error?: string;
}

interface BPTreeVisualization {
  success: boolean;
  treeStructure: string;
  nodeCount: number;
  depth: number;
  error?: string;
}

let shellModule: WebAssembly.Instance | null = null
let bptPrinterModule: WebAssembly.Instance | null = null
let isInitialized = false

export async function initializeBusTub(): Promise<boolean> {
  if (isInitialized) return true

  try {
    // Load both WASM modules
    const [shellResponse, bptResponse] = await Promise.all([
      fetch('/wasm/bustub-wasm-shell.wasm'),
      fetch('/wasm/bustub-wasm-bpt-printer.wasm')
    ])

    const [shellBytes, bptBytes] = await Promise.all([
      shellResponse.arrayBuffer(),
      bptResponse.arrayBuffer()
    ])
    
    // Instantiate both modules
    const [shellInstance, bptInstance] = await Promise.all([
      WebAssembly.instantiate(shellBytes),
      WebAssembly.instantiate(bptBytes)
    ])

    shellModule = shellInstance.instance
    bptPrinterModule = bptInstance.instance
    isInitialized = true
    console.log('BusTub WASM modules initialized successfully')
    return true
  } catch (error) {
    console.error("Failed to initialize BusTub WASM:", error)
    // Fallback to mock for development
    await new Promise((resolve) => setTimeout(resolve, 1000))
    isInitialized = true
    return true
  }
}

export async function executeQuery(query: string): Promise<QueryResult> {
  if (!isInitialized) {
    throw new Error("BusTub WASM module not initialized")
  }

  try {
    // In a real implementation, you would call the shell module
    if (shellModule && shellModule.exports) {
      // Example: return shellModule.exports.execute_query(query)
    }

    // Mock implementation for demonstration
    console.log(`Executing query: ${query}`)
    return {
      success: true,
      data: [],
      executionTime: Math.random() * 100,
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      executionTime: 0,
      error: `Query execution failed: ${error}`,
    }
  }
}

export async function visualizeBPTree(tableName: string): Promise<BPTreeVisualization> {
  if (!isInitialized) {
    throw new Error("BusTub WASM module not initialized")
  }

  try {
    // In a real implementation, you would call the BPT printer module
    if (bptPrinterModule && bptPrinterModule.exports) {
      // Example: return bptPrinterModule.exports.print_bpt(tableName)
    }

    // Mock implementation for demonstration
    console.log(`Visualizing B+ tree for table: ${tableName}`)
    return {
      success: true,
      treeStructure: `
        Root [10, 20]
        ├── Leaf [1, 5, 8]
        ├── Leaf [11, 15, 18]
        └── Leaf [21, 25, 28]
      `,
      nodeCount: 4,
      depth: 2,
    }
  } catch (error) {
    return {
      success: false,
      treeStructure: '',
      nodeCount: 0,
      depth: 0,
      error: `Tree visualization failed: ${error}`,
    }
  }
}

export function isWasmInitialized(): boolean {
  return isInitialized
}
