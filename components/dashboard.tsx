"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Play, Table, TreePine } from "lucide-react"

interface QueryResult {
  success: boolean
  data?: unknown[]
  error?: string
  executionTime?: number
}

interface BPTreeVisualization {
  success: boolean
  treeStructure?: string
  nodeCount?: number
  depth?: number
  error?: string
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [bptResult, setBptResult] = useState<BPTreeVisualization | null>(null)
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM students LIMIT 10;")
  const [selectedTable, setSelectedTable] = useState("students")
  const [isInitialized, setIsInitialized] = useState(false)

  const initializeDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database/init", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        setIsInitialized(true)
        setQueryResult({ success: true, data: [], executionTime: result.executionTime })
      } else {
        setQueryResult({ success: false, error: result.error })
      }
    } catch {
      setQueryResult({ success: false, error: "Failed to initialize database" })
    } finally {
      setIsLoading(false)
    }
  }

  const executeQuery = async () => {
    if (!sqlQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/database/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sqlQuery }),
      })

      const result = await response.json()
      setQueryResult(result)
    } catch {
      setQueryResult({ success: false, error: "Failed to execute query" })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSampleData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database/sample-data", {
        method: "POST",
      })
      const result = await response.json()
      setQueryResult(result)
    } catch {
      setQueryResult({ success: false, error: "Failed to load sample data" })
    } finally {
      setIsLoading(false)
    }
  }

  const visualizeBPTree = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database/visualize-bpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ table: selectedTable }),
      })

      const result = await response.json()
      setBptResult(result)
    } catch {
      setBptResult({ success: false, error: "Failed to visualize B+ tree" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">BusTub Database</h1>
          <p className="text-muted-foreground">WebAssembly-powered database running in your browser</p>
        </div>
      </div>

      <Tabs defaultValue="query" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="query">SQL Query</TabsTrigger>
          <TabsTrigger value="bptree">B+ Tree</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Query Executor
              </CardTitle>
              <CardDescription>Execute SQL queries against your BusTub database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isInitialized && (
                <Alert>
                  <Database className="w-4 h-4" />
                  <AlertDescription>Initialize the database to start executing queries.</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={initializeDatabase}
                  disabled={isLoading || isInitialized}
                  variant={isInitialized ? "secondary" : "default"}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  {isInitialized ? "Database Ready" : "Initialize Database"}
                </Button>

                <Button onClick={loadSampleData} disabled={isLoading || !isInitialized} variant="outline">
                  Load Sample Data
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea
                  id="sql-query"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter your SQL query here..."
                  className="font-mono text-sm min-h-[120px]"
                  disabled={!isInitialized}
                />
              </div>

              <Button
                onClick={executeQuery}
                disabled={isLoading || !isInitialized || !sqlQuery.trim()}
                className="w-full"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Execute Query
              </Button>
            </CardContent>
          </Card>

          {queryResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  Query Results
                  {queryResult.executionTime && (
                    <span className="text-sm font-normal text-muted-foreground">({queryResult.executionTime}ms)</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queryResult.success ? (
                  queryResult.data && queryResult.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-muted">
                            {Object.keys(queryResult.data[0] as Record<string, unknown>).map((key) => (
                              <th key={key} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.data.map((row, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              {Object.values(row as Record<string, unknown>).map((value, cellIndex) => (
                                <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Query executed successfully. No results returned.</p>
                  )
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>{queryResult.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bptree" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5" />
                B+ Tree Visualization
              </CardTitle>
              <CardDescription>Visualize the internal structure of B+ tree indexes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="table-select">Table to Visualize</Label>
                  <select
                    id="table-select"
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                    disabled={!isInitialized}
                  >
                    <option value="students">students</option>
                    <option value="courses">courses</option>
                    <option value="enrollments">enrollments</option>
                  </select>
                </div>

                <Button
                  onClick={visualizeBPTree}
                  disabled={isLoading || !isInitialized}
                  className="mt-8"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TreePine className="w-4 h-4 mr-2" />}
                  Visualize Tree
                </Button>
              </div>

              {!isInitialized && (
                <Alert>
                  <Database className="w-4 h-4" />
                  <AlertDescription>Initialize the database to visualize B+ trees.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {bptResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="w-5 h-5" />
                  Tree Structure
                  {bptResult.nodeCount && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({bptResult.nodeCount} nodes, depth: {bptResult.depth})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bptResult.success ? (
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                      {bptResult.treeStructure}
                    </pre>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>{bptResult.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>View and manage your database structure</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Schema information will be displayed here once the database is initialized.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Monitor query execution and database performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Performance metrics will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
