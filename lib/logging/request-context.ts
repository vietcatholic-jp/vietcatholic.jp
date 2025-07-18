import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export interface RequestContext {
  requestId: string;
  endpoint: string;
  httpMethod: string;
  userAgent?: string;
  ipAddress?: string;
  startTime: number;
}

export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: nanoid(),
    endpoint: request.nextUrl.pathname,
    httpMethod: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    startTime: Date.now(),
  };
}

export function calculateDuration(context: RequestContext): number {
  return Date.now() - context.startTime;
}
