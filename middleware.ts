import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { verifyTokenEdge } from '@/lib/tokenUtils';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/signin',
  '/api/auth/callback',
  '/signup',
  '/create-account',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/signup',
  '/api/auth/demo-setup',
  '/api/auth/activate-user',
  '/api/debug',
  '/favicon.ico',
  '/_next'
];

// File extensions that don't require authentication
const publicExtensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', 
  '.css', '.js', '.map', '.ttf', '.woff', '.woff2'
];

// Check if a path is public
function isPublicPath(path: string): boolean {
  // Always bypass NextAuth API routes
  if (path.startsWith('/api/auth/')) {
    return true;
  }
  
  return (
    publicPaths.some(prefix => path.startsWith(prefix)) ||
    publicExtensions.some(ext => path.endsWith(ext))
  );
}

// Helper for string comparison
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  // Simple implementation that doesn't use crypto
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths to bypass authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Verify the session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // If no token is found, redirect to login
  if (!token) {
    // Create the redirect URL with the return path
    const url = new URL('/login', request.url);
    url.searchParams.set('from', encodeURIComponent(request.nextUrl.pathname));
    
    return NextResponse.redirect(url);
  }
  
  // If session exists, allow the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image).*)',
  ],
}; 