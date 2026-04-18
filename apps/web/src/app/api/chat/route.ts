import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, content, subject_id } = body;

    // Get the JWT from the cookies or authorization header
    // For now, we'll try to get it from the header passed by the client
    const authHeader = req.headers.get('Authorization');

    // Forward the request to the FastAPI backend
    const backendRes = await fetch('http://localhost:8000/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify({
        session_id,
        content,
        subject_id,
      }),
    });

    if (!backendRes.ok) {
      const error = await backendRes.text();
      return NextResponse.json({ error }, { status: backendRes.status });
    }

    // Create a TransformStream to handle the streaming data
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = backendRes.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let buffer = '';

    (async () => {
      try {
        if (!reader) {
          await writer.close();
          return;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // SSE chunks from FastAPI look like "data: {"content": "..."}\n\n"
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);
                
                // If the content contains a SIM token, we need to handle it
                // Format: [SIM:projectile_motion?angle_deg=45&...]
                if (data.content && data.content.includes('[SIM:')) {
                  const simRegex = /\[SIM:([^?\]]+)\?([^\]]+)\]/g;
                  let match;
                  while ((match = simRegex.exec(data.content)) !== null) {
                    const template = match[1];
                    const paramsStr = match[2];
                    const params = Object.fromEntries(new URLSearchParams(paramsStr));
                    
                    // Emit a specialized sim event chunk
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ sim_event: { template, params } })}\n\n`));
                  }
                  
                  // Clean the content of the SIM token before sending text to client
                  data.content = data.content.replace(/\[SIM:[^\]]+\]/g, '');
                }

                if (data.content || data.sim_event || data.error) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                }
              } catch (e) {
                // If it's not JSON, just pass it through as is (unlikely for our SSE setup)
                await writer.write(encoder.encode(`${line}\n\n`));
              }
            }
          }
        }
      } catch (err) {
        console.error('Streaming error:', err);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
