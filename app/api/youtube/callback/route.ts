import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(req: Request) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET || !APP_URL) {
      console.error('Google OAuth env vars missing');
      return NextResponse.json(
        { error: 'Google OAuth is not configured.' },
        { status: 500 }
      );
    }

    console.log('1. Callback hit with URL:', req.url);

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    console.log('2. Code extracted:', code);
    console.log('APP_URL env in callback:', APP_URL);

    const base = (APP_URL || '').replace(/\/$/, '');
    const redirectTarget = `${base || ''}/creator`;

    if (error) {
      console.warn('YouTube OAuth error:', error);
      console.log('Redirecting (error branch) to:', redirectTarget);
      return NextResponse.redirect(redirectTarget);
    }

    if (!code) {
      console.log('No code present; redirecting to:', redirectTarget);
      return NextResponse.redirect(redirectTarget);
    }

    const redirectUri = `${APP_URL.replace(/\/$/, '')}/api/youtube/callback`;

    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    console.log('3. Tokens received from Google');

    const tokenPayload = {
      access_token: tokens.access_token ?? null,
      refresh_token: tokens.refresh_token ?? null,
      expiry_date: tokens.expiry_date ?? null,
    };

    cookies().set('yt_tokens', JSON.stringify(tokenPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log('5. Redirecting to Creator Dashboard at:', redirectTarget);
    return NextResponse.redirect(redirectTarget);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'YouTube OAuth callback failed.';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

