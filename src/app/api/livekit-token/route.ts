import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

const ROOM_NAME = 'birthday-surprise';

export async function GET(req: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json(
      { error: 'LiveKit no configurado. Añade LIVEKIT_API_KEY, LIVEKIT_API_SECRET y NEXT_PUBLIC_LIVEKIT_URL en .env.local' },
      { status: 500 }
    );
  }

  const role = req.nextUrl.searchParams.get('role') ?? 'birthday';
  const identity = role === 'caller' ? 'caller-person' : `birthday-${Date.now()}`;

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: '4h',
  });

  at.addGrant({
    room: ROOM_NAME,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  return NextResponse.json({ token, url: livekitUrl });
}
