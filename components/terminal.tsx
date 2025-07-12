"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { initializeBusTub, executeBusTubCommand, isWasmInitialized } from "@/lib/bustub-wasm"

interface TerminalProps {
  className?: string
}

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'system'
  content: string
  timestamp: Date
}

export function BusTubTerminal({ className = "" }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState("bustub")
  const [multilineBuffer, setMultilineBuffer] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  // Focus input when terminal is clicked
  useEffect(() => {
    const handleClick = () => {
      inputRef.current?.focus()
    }
    
    const terminal = terminalRef.current
    if (terminal) {
      terminal.addEventListener('click', handleClick)
      return () => terminal.removeEventListener('click', handleClick)
    }
  }, [])

  // Initialize BusTub on component mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      addLine("BusTub shell is initializing, please wait...", 'system')
      
      try {
        const success = await initializeBusTub()
        if (success) {
          addLine("", 'system')
          addLine("Live Database Shell", 'system')
          addLine("", 'system')
          addLine("BusTub is a relational database management system built at Carnegie Mellon University", 'system')
          addLine("for the Introduction to Database Systems (15-445/645) course. This system was developed", 'system')
          addLine("for educational purposes and should not be used in production environments.", 'system')
          addLine("", 'system')
          addLine("Use \\help to learn about the usage. Use \\clear to clear the page.", 'system')
          addLine("", 'system')
          addLine("This is BusTub reference solution running in your browser.", 'system')
          addLine("", 'system')
        } else {
          addLine("Failed to initialize BusTub WASM. Running in fallback mode.", 'error')
        }
      } catch {
        addLine("Failed to initialize BusTub WASM. Running in fallback mode.", 'error')
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
    }
    setLines(prev => [...prev, newLine])
  }

  const executeCommand = async (command: string) => {
    const trimmedCommand = command.trim()
    
    // Handle clear command locally
    if (trimmedCommand === "\\clear") {
      setLines([])
      return
    }

    setIsLoading(true)
    
    try {
      const result = await executeBusTubCommand(command)
      
      // Update prompt if provided
      if (result.prompt) {
        setCurrentPrompt(result.prompt)
      }
      
      // Display output
      if (result.output) {
        // Split output into lines and add each one
        const outputLines = result.output.split('\n')
        outputLines.forEach(line => {
          if (line.length > 0 || outputLines.length > 1) {
            addLine(line, result.success ? 'output' : 'error')
          }
        })
      }
      
      // Handle special return codes
      if (result.retCode === 1) {
        addLine("Table truncated due to output limit.", 'system')
      }
      
      if (result.error && !result.output) {
        addLine(result.error, 'error')
      }
      
      // Add empty line after command output
      if (result.output || result.error) {
        addLine("", 'output')
      }
      
    } catch (error) {
      addLine(`Error: ${error}`, 'error')
      addLine("", 'output')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      const fullCommand = multilineBuffer + currentInput
      const isMultiline = !fullCommand.trim().endsWith(';') && !fullCommand.trim().startsWith('\\')
      
      // Show the input line
      const promptSymbol = multilineBuffer ? "... " : `${currentPrompt}> `
      addLine(`${promptSymbol}${currentInput}`, 'input')
      
      if (isMultiline && !fullCommand.trim().startsWith('\\')) {
        // Multi-line SQL command
        setMultilineBuffer(fullCommand + '\n')
        setCurrentInput("")
      } else {
        // Execute the command
        const commandToExecute = fullCommand.trim()
        setMultilineBuffer("")
        setCurrentInput("")
        
        if (commandToExecute) {
          // Add to command history
          setCommandHistory(prev => [...prev, commandToExecute])
          setHistoryIndex(-1)
          executeCommand(commandToExecute)
        }
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Command history navigation
      e.preventDefault()
      if (commandHistory.length > 0) {
        let newIndex = historyIndex
        if (e.key === 'ArrowUp') {
          newIndex = historyIndex >= commandHistory.length - 1 ? commandHistory.length - 1 : historyIndex + 1
        } else {
          newIndex = historyIndex <= 0 ? -1 : historyIndex - 1
        }
        
        setHistoryIndex(newIndex)
        if (newIndex === -1) {
          setCurrentInput("")
        } else {
          setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex])
        }
      }
    } else if (e.key === 'Tab') {
      // Basic tab completion for common commands
      e.preventDefault()
      const commands = ['\\help', '\\clear', '\\dt', '\\di', '\\txn', '\\dbgmvcc']
      const matches = commands.filter(cmd => cmd.startsWith(currentInput))
      if (matches.length === 1) {
        setCurrentInput(matches[0])
      }
    }
  }

  const getCurrentPrompt = () => {
    if (isLoading) return "... "
    if (multilineBuffer) return "... "
    return `${currentPrompt}> `
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardContent className="p-0 h-full">
        <div className="h-full flex flex-col bg-black text-green-400 font-mono text-sm">
          {/* Terminal Header */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-gray-300 text-xs">BusTub Shell</div>
            <div className="text-gray-500 text-xs">
              {isWasmInitialized() ? 'WASM Ready' : 'Fallback Mode'}
            </div>
          </div>

          {/* Terminal Content */}
          <div 
            ref={terminalRef}
            className="flex-1 p-4 overflow-y-auto terminal-scrollbar"
            style={{ minHeight: '400px' }}
          >
            {/* Terminal lines */}
            {lines.map((line) => (
              <div key={line.id} className={`font-mono whitespace-pre-wrap ${
                line.type === 'input' ? 'text-white' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'system' ? 'text-cyan-400' :
                'text-green-400'
              }`}>
                {line.content}
              </div>
            ))}

            {/* Current input line */}
            <div className="flex items-center">
              <span className="text-yellow-400 mr-2">{getCurrentPrompt()}</span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-white font-mono"
                autoFocus
                spellCheck={false}
              />
              {isLoading && (
                <span className="text-gray-400 ml-2">
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                </span>
              )}
            </div>

            {/* Cursor */}
            <div className="w-2 h-4 bg-green-400 terminal-cursor mt-1"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
