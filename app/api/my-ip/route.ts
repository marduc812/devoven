import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'Unknown';

  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const acceptLanguage = request.headers.get('accept-language') || 'Unknown';

  return NextResponse.json({ ip, userAgent, acceptLanguage });
}
