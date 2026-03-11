import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
// Allow large body for video uploads (up to 500MB)
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('recording') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `recording-${Date.now()}.${file.name.endsWith('.mp4') ? 'mp4' : 'webm'}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    console.log(`[upload] Saved recording: ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    return NextResponse.json({ success: true, filename });
  } catch (err) {
    console.error('[upload] Error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
