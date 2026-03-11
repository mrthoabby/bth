import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  if (!name || name.includes('..') || name.includes('/')) {
    return new NextResponse('Invalid', { status: 400 });
  }
  const filePath = path.join(process.cwd(), 'uploads', name);
  try {
    const data = await readFile(filePath);
    const ext = name.endsWith('.mp4') ? 'mp4' : 'webm';
    return new NextResponse(data, {
      headers: {
        'Content-Type': `video/${ext}`,
        'Content-Disposition': `inline; filename="${name}"`,
        'Accept-Ranges': 'bytes',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
