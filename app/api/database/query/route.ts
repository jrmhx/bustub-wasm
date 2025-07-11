export const runtime = "nodejs"

interface QueryRequest {
  query: string
}

export async function POST(request: Request) {
  try {
    const { query }: QueryRequest = await request.json()

    if (!query || !query.trim()) {
      return Response.json(
        {
          success: false,
          error: "Query cannot be empty",
        },
        { status: 400 },
      )
    }

    const startTime = Date.now()

    // In a real implementation, this would execute the query using your BusTub WASM module
    // For demonstration, we'll return mock data based on the query
    let mockData: any[] = []

    if (query.toLowerCase().includes("select")) {
      // Mock some sample data
      mockData = [
        { id: 1, name: "Alice Johnson", age: 22, major: "Computer Science" },
        { id: 2, name: "Bob Smith", age: 21, major: "Mathematics" },
        { id: 3, name: "Carol Davis", age: 23, major: "Physics" },
        { id: 4, name: "David Wilson", age: 20, major: "Chemistry" },
        { id: 5, name: "Eve Brown", age: 22, major: "Biology" },
      ]
    }

    const executionTime = Date.now() - startTime

    return Response.json({
      success: true,
      data: mockData,
      executionTime,
      query,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Query execution failed: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}
