export const runtime = "nodejs"

export async function POST() {
  try {
    const startTime = Date.now()

    // In a real implementation, this would load sample data into your BusTub database
    // Simulate loading sample data
    await new Promise((resolve) => setTimeout(resolve, 500))

    const executionTime = Date.now() - startTime

    return Response.json({
      success: true,
      message: "Sample data loaded successfully",
      data: [
        { table: "students", rows: 100 },
        { table: "courses", rows: 25 },
        { table: "enrollments", rows: 250 },
      ],
      executionTime,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Failed to load sample data: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}
