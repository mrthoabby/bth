// In-memory ring flag — resets on server restart, fine for single VPS
let ringing = false;

export async function GET() {
  return Response.json({ ringing });
}

export async function POST(request: Request) {
  const { action } = await request.json();
  ringing = action === 'ring';
  return Response.json({ ok: true });
}
