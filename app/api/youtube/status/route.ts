import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const tokenCookie = cookies().get('yt_tokens');
  const linked = Boolean(tokenCookie?.value);
  return NextResponse.json({ linked });
}

