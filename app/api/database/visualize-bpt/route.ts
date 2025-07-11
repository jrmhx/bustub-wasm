import { NextRequest, NextResponse } from 'next/server'
import { visualizeBPTree } from '@/lib/bustub-wasm'

export async function POST(request: NextRequest) {
  try {
    const { table } = await request.json()

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table name is required' },
        { status: 400 }
      )
    }

    const result = await visualizeBPTree(table)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('B+ tree visualization error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to visualize B+ tree',
        treeStructure: '',
        nodeCount: 0,
        depth: 0
      },
      { status: 500 }
    )
  }
}
