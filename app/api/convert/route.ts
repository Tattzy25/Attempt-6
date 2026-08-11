import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const targetUrl = 'https://convert.tattty.com/';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const convertUrl = body.convertUrl || targetUrl;
      const payload = body.payload || body;

      const response = await fetch(convertUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      // Handle multipart/form-data
      const formData = await req.formData();
      const response = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
        cache: 'no-store',
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Convert failed';
    console.error('[Convert Proxy Error]:', errMessage);
    return NextResponse.json(
      { error: 'Convert proxy failed', details: errMessage },
      { status: 500 }
    );
  }
}
