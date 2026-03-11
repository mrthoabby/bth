import { NextRequest, NextResponse } from 'next/server';
import { appendFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

/**
 * POST /api/upload-chunk
 * Receives a single MediaRecorder chunk and appends it to the session file.
 * Body: FormData { sessionId: string, chunkIndex: string, chunk: Blob }
 *
 * The first chunk (index 0) creates the file.
 * Subsequent chunks are appended — this works because WebM chunks from
 * MediaRecorder timeslice mode are valid appendable cluster data.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string | null;
    const chunkIndex = parseInt((formData.get('chunkIndex') as string) ?? '0', 10);
    const chunk = formData.get('chunk') as File | null;

    if (!sessionId || !chunk) {
      return NextResponse.json({ error: 'Missing sessionId or chunk' }, { status: 400 });
    }

    // Sanitize sessionId to prevent path traversal
    const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeSession) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${safeSession}.webm`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await chunk.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (chunkIndex === 0) {
      // First chunk: create (or overwrite) the file
      await writeFile(filepath, buffer);
    } else {
      // Subsequent chunks: append
      await appendFile(filepath, buffer);
    }

    console.log(`[chunk] session=${safeSession} chunk=${chunkIndex} size=${(buffer.length / 1024).toFixed(1)}KB`);

    return NextResponse.json({ ok: true, session: safeSession, chunkIndex });
  } catch (err) {
    console.error('[upload-chunk] Error:', err);
    return NextResponse.json({ error: 'Chunk upload failed' }, { status: 500 });
  }
}
