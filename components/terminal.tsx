"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { initializeBusTub, executeBusTubCommand } from "@/lib/bustub-wasm"

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'system'
  content: string
  timestamp: Date
  isHtml?: boolean
}

export function Terminal() {
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

  // Focus input when terminal is clicked (but not when selecting text)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't focus if user is selecting text
      const selection = window.getSelection()
      if (selection && selection.toString().length > 0) {
        return
      }
      
      // Don't focus if clicking on a specific element (like tables)
      const target = e.target as HTMLElement
      if (target.tagName === 'TD' || target.tagName === 'TH' || target.tagName === 'TABLE') {
        return
      }
      
      inputRef.current?.focus()
    }
    
    const terminal = terminalRef.current
    if (terminal) {
      terminal.addEventListener('click', handleClick)
      return () => terminal.removeEventListener('click', handleClick)
    }
  }, [])

  const isHtmlContent = (content: string): boolean => {
    // Check for common HTML tags that BusTub returns
    return /<(div|table|thead|tbody|tr|td|th|span|br|hr)\b[^>]*>/i.test(content) || 
           content.includes('&lt;') || 
           content.includes('&gt;') ||
           content.includes('&amp;')
  }

  const addLine = useCallback((content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
      isHtml: isHtmlContent(content)
    }
    setLines(prev => [...prev, newLine])
  }, [])

  // Initialize BusTub on component mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      addLine("BusTub shell is initializing, please wait...", 'system')
      
      try {
        const success = await initializeBusTub()
        if (success) {
          // Add the welcome message similar to CMU shell
          addLine("", 'system')
          addLine("Live Database Shell", 'system')
          addLine("", 'system')
          addLine("Solution Version: local . BusTub Version: local . Built Date: " + new Date().toISOString().slice(0, 8).replace(/-/g, ''), 'system')
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
  }, [addLine])

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
        // Check if the entire output is HTML content
        if (isHtmlContent(result.output)) {
          // For HTML content, add as a single line to preserve structure
          addLine(result.output, result.success ? 'output' : 'error')
        } else {
          // Split output into lines and add each one for plain text
          const outputLines = result.output.split('\n')
          outputLines.forEach(line => {
            if (line.length > 0 || outputLines.length > 1) {
              addLine(line, result.success ? 'output' : 'error')
            }
          })
        }
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

  return (
    <div className="min-h-screen bg-white text-black font-mono relative overflow-hidden">
      {/* Terminal-specific styles for HTML content */}
      <style jsx>{`
        .terminal-html-content table {
          border-collapse: collapse;
          font-family: "Source Code Pro", "Courier New", monospace;
          font-size: inherit;
          margin: 0;
          white-space: pre;
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        .terminal-html-content td, .terminal-html-content th {
          border: 1px solid #333;
          padding: 2px 8px;
          text-align: left;
          white-space: pre;
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        .terminal-html-content th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .terminal-html-content tr:nth-child(even) {
          background-color: #fafafa;
        }
        .terminal-html-content div {
          font-family: inherit;
          font-size: inherit;
          white-space: pre-wrap;
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        .terminal-lines * {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
      `}</style>
      
      {/* Background pattern similar to CMU shell */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='50' fill='%23000'%3E🚌%3C/text%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          transform: 'rotate(-30deg)',
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Terminal container */}
      <div 
        ref={terminalRef}
        className="h-screen overflow-y-auto p-4 cursor-text relative z-10"
        style={{
          fontSize: 'calc(1.2 * 12px)',
          lineHeight: '1.2',
          fontFamily: '"Source Code Pro", "Courier New", monospace',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text'
        }}
      >
        {/* Terminal lines */}
        <div className="space-y-0 terminal-lines" style={{ userSelect: 'text' }}>
          {lines.map((line) => (
            <div 
              key={line.id} 
              className="whitespace-pre-wrap" 
              style={{ 
                whiteSpace: 'pre',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                MozUserSelect: 'text',
                msUserSelect: 'text'
              }}
            >
              {line.type === 'input' && (
                <span style={{ userSelect: 'text' }}>{line.content}</span>
              )}
              {line.type === 'output' && (
                line.isHtml ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: line.content }}
                    className="terminal-html-content"
                    style={{ userSelect: 'text' }}
                  />
                ) : (
                  <span style={{ userSelect: 'text' }}>{line.content}</span>
                )
              )}
              {line.type === 'error' && (
                line.isHtml ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: line.content }}
                    className="terminal-html-content text-red-600"
                    style={{ userSelect: 'text' }}
                  />
                ) : (
                  <span className="text-red-600" style={{ userSelect: 'text' }}>{line.content}</span>
                )
              )}
              {line.type === 'system' && (
                <span className="text-gray-600" style={{ userSelect: 'text' }}>{line.content}</span>
              )}
            </div>
          ))}
        </div>

        {/* Current input line */}
        <div className="flex items-center">
          <span className="select-none font-bold">
            {multilineBuffer ? "... " : `${currentPrompt}> `}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none border-none font-mono"
            style={{ fontSize: 'inherit', fontFamily: 'inherit' }}
            disabled={isLoading}
            autoFocus
          />
          {isLoading && (
            <span className="ml-2 text-gray-500">...</span>
          )}
        </div>
      </div>
    </div>
  )
}
