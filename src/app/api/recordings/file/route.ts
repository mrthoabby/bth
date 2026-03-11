import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') ?? '';
  const session = req.nextUrl.searchParams.get('session') ?? '';

  // Security: no path traversal
  if (name.includes('..') || name.includes('/') || session.includes('..') || session.includes('/')) {
    return new NextResponse('Invalid', { status: 400 });
  }

  const UPLOADS = path.join(process.cwd(), 'uploads');
  const filePath = session
    ? path.join(UPLOADS, 'photos', session, name)
    : path.join(UPLOADS, name);

  try {
    const data = await readFile(filePath);
    const isImage = /\.(jpe?g|png|webp)$/i.test(name);
    const ext = name.split('.').pop()?.toLowerCase() ?? 'webm';
    const mime = isImage
      ? (ext === 'png' ? 'image/png' : 'image/jpeg')
      : `video/${ext === 'mp4' ? 'mp4' : 'webm'}`;
    return new NextResponse(data, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${name}"`,
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
