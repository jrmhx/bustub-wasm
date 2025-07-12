import { NextRequest, NextResponse } from 'next/server'
import { executeBusTubCommand } from '@/lib/bustub-wasm'

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json(
        { success: false, error: 'Command is required' },
        { status: 400 }
      )
    }

    const result = await executeBusTubCommand(command)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('BusTub command execution error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute command',
        data: [],
        executionTime: 0
      },
      { status: 500 }
    )
  }
}
