import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const backendRes = await fetch('http://localhost:8000/curriculum/sources', {
      headers: {
        'Authorization': authHeader || '',
      },
    });

    if (!backendRes.ok) {
      const error = await backendRes.text();
      console.error('Curriculum sources backend error:', error);
      return NextResponse.json({ error }, { status: backendRes.status });
    }


    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
