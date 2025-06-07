import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { documentUrl } = await request.json();
    
    if (!documentUrl) {
      return NextResponse.json({ error: 'Document URL is required' }, { status: 400 });
    }

    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          document_url: documentUrl,
        },
        include_image_base64: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error performing OCR with Mistral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}