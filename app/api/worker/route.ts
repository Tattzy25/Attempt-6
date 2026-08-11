import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerUrl, payload } = body;

    const targetUrl = workerUrl || 'https://api.tattty.com/';
    const targetPayload = payload || body;

    console.log('[Worker Proxy] Forwarding request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(targetPayload),
      cache: 'no-store',
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw_response: rawText };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown proxy error';
    console.error('[Worker Proxy Error]:', errMessage);
    return NextResponse.json(
      { error: 'Worker proxy request failed', details: errMessage },
      { status: 500 }
    );
  }
}
