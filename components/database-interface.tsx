"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Play, Table } from "lucide-react"

interface QueryResult {
  success: boolean
  data?: any[]
  error?: string
  executionTime?: number
}

export function DatabaseInterface() {
  const [isLoading, setIsLoading] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM students LIMIT 10;")
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      setQueryResult({ success: false, error: "Failed to load sample data" })
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="query">SQL Query</TabsTrigger>
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
                            {Object.keys(queryResult.data[0]).map((key) => (
                              <th key={key} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.data.map((row, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              {Object.values(row).map((value, cellIndex) => (
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
