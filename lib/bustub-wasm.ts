interface QueryResult {
  success: boolean;
  data: Record<string, unknown>[];
  executionTime: number;
  error?: string;
  retCode?: number;
  prompt?: string;
  output?: string;
}

interface BPTreeVisualization {
  success: boolean;
  treeStructure: string;
  nodeCount: number;
  depth: number;
  error?: string;
}

// Define types for the WASM module
interface EmscriptenModule {
  cwrap: (name: string, returnType: string, argTypes: string[]) => (...args: unknown[]) => unknown;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  stringToUTF8: (str: string, ptr: number, maxBytesToWrite: number) => void;
  UTF8ToString: (ptr: number) => string;
}

declare global {
  interface Window {
    Module?: EmscriptenModule;
  }
}

// Global state
let isInitialized = false

// WASM function wrappers
let executeQuery: ((query: string, promptPtr: number, outputPtr: number, bufferSize: number) => number) | null = null
let initialize: (() => number) | null = null
let bptInitialize: ((leafMax: number, internalMax: number) => number) | null = null
let bptExecuteQuery: ((command: string, outputPtr: number, bufferSize: number) => number) | null = null

export async function initializeBusTub(): Promise<boolean> {
  if (isInitialized) return true

  try {
    // Load the JavaScript glue code first, which will load the WASM
    await loadBusTubModule()
    
    isInitialized = true
    console.log('BusTub WASM modules initialized successfully')
    return true
  } catch (error) {
    console.error("Failed to initialize BusTub WASM:", error)
    return initializeFallback()
  }
}

async function loadBusTubModule(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window not available'))
      return
    }

    // Set up the Module configuration before loading the script
    (window as unknown as { Module: { onRuntimeInitialized: () => void } }).Module = {
      onRuntimeInitialized: () => {
        console.log('BusTub WASM runtime initialized')
        setupWasmBindings()
        resolve()
      }
    }

    // Create script element to load the JavaScript glue code
    const script = document.createElement('script')
    script.src = '/wasm/bustub-wasm-shell.js'
    script.async = true
    
    script.onload = () => {
      console.log('BusTub shell JS loaded, waiting for runtime initialization')
    }
    
    script.onerror = (error) => {
      console.error('Failed to load BusTub shell JS:', error)
      reject(new Error('Failed to load BusTub shell JS'))
    }
    
    document.head.appendChild(script)
    
    // Add timeout
    setTimeout(() => {
      reject(new Error('WASM loading timeout'))
    }, 15000)
  })
}

function setupWasmBindings() {
  const Module = window.Module
  if (!Module || !Module.cwrap) return

  try {
    // Main shell functions
    executeQuery = Module.cwrap('BusTubExecuteQuery', 'number', ['string', 'number', 'number', 'number']) as ((query: string, promptPtr: number, outputPtr: number, bufferSize: number) => number)
    initialize = Module.cwrap('BusTubInit', 'number', []) as (() => number)
    
    // Initialize the database
    if (initialize) {
      initialize()
    }

    console.log('WASM function bindings established')
  } catch (error) {
    console.error('Failed to setup WASM bindings:', error)
  }
}

async function initializeFallback(): Promise<boolean> {
  // Fallback initialization for development
  await new Promise((resolve) => setTimeout(resolve, 1000))
  isInitialized = true
  return true
}

export async function executeBusTubCommand(command: string): Promise<QueryResult> {
  if (!isInitialized) {
    throw new Error("BusTub WASM module not initialized")
  }

  // Only handle clear command client-side
  if (command === "\\clear") {
    return {
      success: true,
      data: [],
      executionTime: 0,
      output: ""
    }
  }

  const startTime = Date.now()

  try {
    if (executeQuery && typeof window !== 'undefined' && window.Module) {
      // Use actual WASM execution
      const Module = window.Module
      const bufferSize = 64 * 1024
      
      const ptrOutput = Module._malloc(bufferSize)
      const ptrPrompt = Module._malloc(bufferSize)
      
      Module.stringToUTF8("", ptrOutput, bufferSize)
      Module.stringToUTF8("", ptrPrompt, bufferSize)
      
      const retCode = executeQuery(command, ptrPrompt, ptrOutput, bufferSize)
      const output = Module.UTF8ToString(ptrOutput)
      const prompt = Module.UTF8ToString(ptrPrompt)
      
      Module._free(ptrOutput)
      Module._free(ptrPrompt)
      
      const executionTime = Date.now() - startTime
      
      return {
        success: retCode === 0,
        data: [],
        executionTime,
        retCode,
        prompt,
        output,
        error: retCode !== 0 ? undefined : undefined
      }
    } else {
      // For any command, return appropriate error when WASM is not loaded
      return {
        success: false,
        data: [],
        executionTime: Date.now() - startTime,
        error: "WASM module not loaded. Please wait for initialization to complete."
      }
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      executionTime: Date.now() - startTime,
      error: `Command execution failed: ${error}`
    }
  }
}

export async function initializeBPTreePrinter(leafMaxSize: number, internalMaxSize: number): Promise<boolean> {
  try {
    // Load B+ tree printer WASM module
    const bptResponse = await fetch('/wasm/bustub-wasm-bpt-printer.wasm')
    if (!bptResponse.ok) {
      console.warn('BPT Printer WASM not found')
      return false
    }

    const bptBytes = await bptResponse.arrayBuffer()
    await WebAssembly.instantiate(bptBytes)
    // Note: We don't need to store the module instance if it's not used

    // Setup BPT functions when Module is ready
    if (typeof window !== 'undefined' && window.Module) {
      setupBPTBindings(leafMaxSize, internalMaxSize)
    }
    
    return true
  } catch (error) {
    console.error("Failed to initialize BPT Printer:", error)
    return false
  }
}

function setupBPTBindings(leafMaxSize: number, internalMaxSize: number) {
  const Module = window.Module
  if (!Module || !Module.cwrap) return

  try {
    bptInitialize = Module.cwrap('BusTubInit', 'number', ['number', 'number']) as ((leafMax: number, internalMax: number) => number)
    bptExecuteQuery = Module.cwrap('BusTubApplyCommand', 'number', ['string', 'number', 'number']) as ((command: string, outputPtr: number, bufferSize: number) => number)
    
    if (bptInitialize) {
      bptInitialize(leafMaxSize, internalMaxSize)
    }
  } catch (error) {
    console.error('Failed to setup BPT bindings:', error)
  }
}

export async function visualizeBPTree(command: string): Promise<BPTreeVisualization> {
  try {
    if (bptExecuteQuery && typeof window !== 'undefined' && window.Module) {
      const Module = window.Module
      const bufferSize = 64 * 1024
      const ptrOutput = Module._malloc(bufferSize)
      
      Module.stringToUTF8("", ptrOutput, bufferSize)
      const retCode = bptExecuteQuery(command, ptrOutput, bufferSize)
      const output = Module.UTF8ToString(ptrOutput)
      
      Module._free(ptrOutput)
      
      if (retCode === 0) {
        return {
          success: true,
          treeStructure: output,
          nodeCount: (output.match(/node/gi) || []).length,
          depth: (output.split('\n').length),
        }
      } else {
        return {
          success: false,
          treeStructure: '',
          nodeCount: 0,
          depth: 0,
          error: retCode === 1 ? "Something went wrong" : "Output truncated due to limit"
        }
      }
    } else {
      // Fallback
      return {
        success: true,
        treeStructure: `Mock B+ Tree visualization for command: ${command}\n(WASM not loaded - development mode)`,
        nodeCount: 3,
        depth: 2,
      }
    }
  } catch (error) {
    return {
      success: false,
      treeStructure: '',
      nodeCount: 0,
      depth: 0,
      error: `BPT visualization failed: ${error}`
    }
  }
}

export function isWasmInitialized(): boolean {
  return isInitialized
}
