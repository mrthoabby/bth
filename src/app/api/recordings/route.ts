import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    const files = await readdir(uploadsDir);
    const recordings = await Promise.all(
      files
        .filter((f) => f.endsWith('.webm') || f.endsWith('.mp4'))
        .map(async (f) => {
          const s = await stat(path.join(uploadsDir, f));
          return { name: f, size: s.size, mtime: s.mtimeMs };
        })
    );
    recordings.sort((a, b) => b.mtime - a.mtime);
    return NextResponse.json({ recordings });
  } catch {
    return NextResponse.json({ recordings: [] });
  }
}
