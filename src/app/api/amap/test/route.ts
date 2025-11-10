import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "API proxy test route is working",
    timestamp: new Date().toISOString()
  });
}