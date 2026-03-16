import { NextResponse } from 'next/server';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export async function POST(req: Request) {
  try {
    if (!RECAPTCHA_SECRET_KEY) {
      console.error('RECAPTCHA_SECRET_KEY is not set.');
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA is not configured.' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing reCAPTCHA token.' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams();
    params.append('secret', RECAPTCHA_SECRET_KEY);
    params.append('response', token);

    const verifyRes = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await verifyRes.json();
    const success = !!data.success;

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'reCAPTCHA verification failed.',
          details: data['error-codes'] ?? null,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to verify reCAPTCHA.';
    console.error(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

