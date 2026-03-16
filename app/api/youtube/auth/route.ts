import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET() {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET || !APP_URL) {
      console.error('Google OAuth env vars missing');
      return NextResponse.json(
        { error: 'Google OAuth is not configured.' },
        { status: 500 }
      );
    }

    const redirectUri = `${APP_URL.replace(/\/$/, '')}/api/youtube/callback`;

    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/yt-analytics.readonly'],
      prompt: 'consent',
    });

    return NextResponse.redirect(authUrl);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to start YouTube auth.';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

