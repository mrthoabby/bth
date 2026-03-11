import { NextResponse } from 'next/server';
import { readdir, stat, rm } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const UPLOADS = path.join(process.cwd(), 'uploads');

export async function GET() {
  try {
    const files = await readdir(UPLOADS);

    // Videos
    const videos = await Promise.all(
      files
        .filter((f) => f.endsWith('.webm') || f.endsWith('.mp4'))
        .map(async (f) => {
          const s = await stat(path.join(UPLOADS, f));
          return { type: 'video' as const, name: f, size: s.size, mtime: s.mtimeMs };
        })
    );

    // Photos — each session is a subfolder inside uploads/photos/
    const photosDir = path.join(UPLOADS, 'photos');
    let photos: { type: 'photo'; session: string; name: string; size: number; mtime: number }[] = [];
    try {
      const sessions = await readdir(photosDir);
      for (const session of sessions) {
        const sessionPath = path.join(photosDir, session);
        const sessionStat = await stat(sessionPath);
        if (!sessionStat.isDirectory()) continue;
        const imgs = await readdir(sessionPath);
        for (const img of imgs.filter((f) => /\.(jpe?g|png|webp)$/i.test(f))) {
          const s = await stat(path.join(sessionPath, img));
          photos.push({ type: 'photo', session, name: img, size: s.size, mtime: s.mtimeMs });
        }
      }
    } catch { /* no photos folder yet */ }

    const all = [...videos, ...photos].sort((a, b) => b.mtime - a.mtime);
    return NextResponse.json({ items: all });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

// DELETE all recordings and photos
export async function DELETE() {
  try {
    const files = await readdir(UPLOADS);
    await Promise.all(
      files
        .filter((f) => f.endsWith('.webm') || f.endsWith('.mp4'))
        .map((f) => rm(path.join(UPLOADS, f), { force: true }))
    );
    const photosDir = path.join(UPLOADS, 'photos');
    try {
      await rm(photosDir, { recursive: true, force: true });
    } catch { /* ok */ }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
