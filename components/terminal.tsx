"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface TerminalProps {
  className?: string
}

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'system'
  content: string
  timestamp: Date
}

export function Terminal({ className = "" }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [prompt] = useState("bustub")
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

  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
    }
    setLines(prev => [...prev, newLine])
  }

  const initializeDatabase = async () => {
    setIsLoading(true)
    addLine("Initializing BusTub database...", 'system')
    
    try {
      const response = await fetch("/api/database/init", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        setIsInitialized(true)
        addLine(`Database initialized successfully in ${result.executionTime}ms`, 'system')
        addLine("", 'system')
        addLine("BusTub is a relational database management system built at Carnegie Mellon University", 'system')
        addLine("for the Introduction to Database Systems (15-445/645) course.", 'system')
        addLine("", 'system')
        addLine("Use \\help to learn about the usage. Use \\clear to clear the terminal.", 'system')
        addLine("", 'system')
      } else {
        addLine(`Failed to initialize database: ${result.error}`, 'error')
      }
    } catch {
      addLine("Failed to initialize database: Network error", 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const executeCommand = async (command: string) => {
    const trimmedCommand = command.trim()
    
    // Handle built-in commands
    if (trimmedCommand === "\\clear") {
      setLines([])
      return
    }
    
    if (trimmedCommand === "\\help") {
      addLine("BusTub Database Shell Commands:", 'system')
      addLine("", 'system')
      addLine("System Commands:", 'system')
      addLine("  \\help        - Show this help message", 'system')
      addLine("  \\clear       - Clear the terminal", 'system')
      addLine("  \\init        - Initialize the database", 'system')
      addLine("  \\sample      - Load sample data", 'system')
      addLine("  \\schema      - Show database schema", 'system')
      addLine("  \\tables      - List all tables", 'system')
      addLine("  \\describe <table> - Describe table structure", 'system')
      addLine("  \\bpt <table> - Visualize B+ tree for table", 'system')
      addLine("  \\stats       - Show database statistics", 'system')
      addLine("  \\version     - Show version information", 'system')
      addLine("", 'system')
      addLine("SQL Commands:", 'system')
      addLine("  SELECT, INSERT, UPDATE, DELETE, CREATE, DROP", 'system')
      addLine("  Commands should end with semicolon (;)", 'system')
      addLine("  Multi-line commands are supported", 'system')
      addLine("", 'system')
      addLine("Examples:", 'system')
      addLine("  SELECT * FROM students;", 'system')
      addLine("  INSERT INTO students VALUES (1, 'John', 'john@cmu.edu', 'CS');", 'system')
      addLine("  \\bpt students", 'system')
      return
    }
    
    if (trimmedCommand === "\\init") {
      await initializeDatabase()
      return
    }
    
    if (trimmedCommand === "\\sample") {
      setIsLoading(true)
      try {
        const response = await fetch("/api/database/sample-data", {
          method: "POST",
        })
        const result = await response.json()
        if (result.success) {
          addLine("Sample data loaded successfully", 'system')
        } else {
          addLine(`Failed to load sample data: ${result.error}`, 'error')
        }
      } catch {
        addLine("Failed to load sample data: Network error", 'error')
      } finally {
        setIsLoading(false)
      }
      return
    }
    
    if (trimmedCommand === "\\schema") {
      addLine("Database schema:", 'system')
      addLine("  students (id, name, email, major)", 'system')
      addLine("  courses (id, name, credits, department)", 'system')
      addLine("  enrollments (student_id, course_id, grade)", 'system')
      return
    }
    
    if (trimmedCommand === "\\tables") {
      addLine("Available tables:", 'system')
      addLine("  students", 'system')
      addLine("  courses", 'system')
      addLine("  enrollments", 'system')
      return
    }
    
    if (trimmedCommand.startsWith("\\describe ")) {
      const table = trimmedCommand.substring(10).trim()
      addLine(`Table: ${table}`, 'system')
      switch (table) {
        case 'students':
          addLine("  id       INTEGER PRIMARY KEY", 'system')
          addLine("  name     VARCHAR(255)", 'system')
          addLine("  email    VARCHAR(255)", 'system')
          addLine("  major    VARCHAR(100)", 'system')
          break
        case 'courses':
          addLine("  id          INTEGER PRIMARY KEY", 'system')
          addLine("  name        VARCHAR(255)", 'system')
          addLine("  credits     INTEGER", 'system')
          addLine("  department  VARCHAR(100)", 'system')
          break
        case 'enrollments':
          addLine("  student_id  INTEGER", 'system')
          addLine("  course_id   INTEGER", 'system')
          addLine("  grade       VARCHAR(2)", 'system')
          break
        default:
          addLine(`Table '${table}' not found`, 'error')
      }
      return
    }
    
    if (trimmedCommand === "\\stats") {
      addLine("Database Statistics:", 'system')
      addLine("  Total tables: 3", 'system')
      addLine("  Storage engine: BusTub", 'system')
      addLine("  Index type: B+ Tree", 'system')
      addLine("  Buffer pool size: 64MB", 'system')
      return
    }
    
    if (trimmedCommand === "\\version") {
      addLine("BusTub Database Management System", 'system')
      addLine("Version: WebAssembly Build", 'system')
      addLine("Built for: CMU 15-445/645 Database Systems", 'system')
      addLine("Runtime: WebAssembly in Browser", 'system')
      return
    }

    // Handle SQL commands
    if (!isInitialized) {
      addLine("Database not initialized. Use \\init to initialize.", 'error')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: command }),
      })
      const result = await response.json()
      
      if (result.success) {
        if (result.data && result.data.length > 0) {
          // Format table output
          const headers = Object.keys(result.data[0])
          const headerLine = headers.join(" | ")
          const separatorLine = headers.map(h => "-".repeat(h.length)).join("-+-")
          
          addLine(headerLine, 'output')
          addLine(separatorLine, 'output')
          
          result.data.forEach((row: Record<string, unknown>) => {
            const rowLine = headers.map(h => String(row[h] || "").padEnd(h.length)).join(" | ")
            addLine(rowLine, 'output')
          })
          
          addLine("", 'output')
          addLine(`(${result.data.length} row${result.data.length !== 1 ? 's' : ''}) Time: ${result.executionTime}ms`, 'system')
        } else {
          addLine(`Query executed successfully. Time: ${result.executionTime}ms`, 'system')
        }
      } else {
        addLine(`Error: ${result.error}`, 'error')
      }
    } catch {
      addLine("Failed to execute query: Network error", 'error')
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
      const promptSymbol = multilineBuffer ? "... " : `${prompt}> `
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
    }
  }

  const getCurrentPrompt = () => {
    if (isLoading) return "... "
    if (multilineBuffer) return "... "
    return `${prompt}> `
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
            <div className="text-gray-300 text-xs">BusTub Terminal</div>
            <div className="text-gray-500 text-xs">
              {isInitialized ? 'Ready' : 'Not initialized'}
            </div>
          </div>

          {/* Terminal Content */}
          <div 
            ref={terminalRef}
            className="flex-1 p-4 overflow-y-auto terminal-scrollbar"
            style={{ minHeight: '400px' }}
          >
            {/* Welcome message */}
            {lines.length === 0 && (
              <div className="mb-4 space-y-1">
                <div className="text-cyan-400 font-bold">Welcome to BusTub Database Shell</div>
                <div className="text-gray-400">Type \\help for available commands or \\init to initialize the database.</div>
                <div className="text-gray-400">Version: WebAssembly Build</div>
                <div></div>
              </div>
            )}

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
