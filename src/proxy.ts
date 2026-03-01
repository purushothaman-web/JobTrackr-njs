import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const origin = request.headers.get('origin');
  console.log(`[Proxy] ${request.method} ${request.nextUrl.pathname} | Origin: ${origin || 'None'}`);
  
  const allowedOrigins = [
    process.env.FRONTEND_URL, 
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000' 
  ].filter(Boolean);

  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  if (request.method === 'OPTIONS') {
    const headers = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
    };
    
    return new NextResponse(null, { status: 200, headers });
  }

  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
