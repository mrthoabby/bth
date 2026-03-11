import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

/**
 * POST /api/save-photos
 * Receives individual photos + a collage from the PhotoSession.
 * Body: FormData {
 *   sessionId: string,
 *   photo_0: File,
 *   photo_1: File,
 *   ...
 *   collage: File   (optional)
 * }
 * Saves to: uploads/photos/{sessionId}/
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sessionId = (formData.get('sessionId') as string | null) ?? `photos-${Date.now()}`;

    // Sanitize
    const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');

    const dir = path.join(process.cwd(), 'uploads', 'photos', safeSession);
    await mkdir(dir, { recursive: true });

    const saved: string[] = [];

    for (const [key, value] of formData.entries()) {
      if (key === 'sessionId') continue;
      if (!(value instanceof File)) continue;

      const filename = key === 'collage' ? 'collage.jpg' : `${key}.jpg`;
      const filepath = path.join(dir, filename);
      const buffer = Buffer.from(await value.arrayBuffer());
      await writeFile(filepath, buffer);
      saved.push(filename);
      console.log(`[save-photos] ${safeSession}/${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
    }

    return NextResponse.json({ ok: true, session: safeSession, files: saved });
  } catch (err) {
    console.error('[save-photos] Error:', err);
    return NextResponse.json({ error: 'Failed to save photos' }, { status: 500 });
  }
}
