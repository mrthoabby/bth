'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  title: string;
  subtitle: string;
  totalPhotos: number;
  onContinue: () => void;
  onPhotoCaptured?: (photoDataUrl: string) => void;
}

type Step = 'loading' | 'countdown' | 'captured' | 'confirm' | 'collage';

async function buildCollage(photos: string[]): Promise<string> {
  const N = photos.length;
  const POLAROID_W = 320;
  const POLAROID_H = 320;
  const PAD = 16;
  const CAPTION_H = 40;
  const PHOTO_W = POLAROID_W - PAD * 2;
  const PHOTO_H = POLAROID_H - PAD * 2 - CAPTION_H;
  const cols = Math.min(N, 3);
  const rows = Math.ceil(N / cols);
  const GAP = 24;
  const canvasW = cols * POLAROID_W + (cols - 1) * GAP + GAP * 2;
  const canvasH = rows * POLAROID_H + (rows - 1) * GAP + GAP * 2 + 60;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#faf9f8';
  ctx.fillRect(0, 0, canvasW, canvasH);
  const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
  grad.addColorStop(0, 'rgba(232, 212, 217, 0.4)');
  grad.addColorStop(1, 'rgba(212, 193, 154, 0.2)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.font = 'bold 22px -apple-system, Helvetica Neue, sans-serif';
  ctx.fillStyle = '#0c0c0c';
  ctx.textAlign = 'center';
  ctx.fillText('💕 Mis recuerdos favoritos', canvasW / 2, 40);

  const imgs = await Promise.all(
    photos.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = src;
        })
    )
  );

  imgs.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = GAP + col * (POLAROID_W + GAP);
    const y = 60 + GAP + row * (POLAROID_H + GAP);

    ctx.shadowColor = 'rgba(12, 12, 12, 0.15)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#f5f2f0';
    roundRect(ctx, x, y, POLAROID_W, POLAROID_H, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(168, 93, 107, 0.22)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, POLAROID_W, POLAROID_H, 12);
    ctx.stroke();

    ctx.save();
    roundRect(ctx, x + PAD, y + PAD, PHOTO_W, PHOTO_H, 8);
    ctx.clip();
    const scale = Math.max(PHOTO_W / img.width, PHOTO_H / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(img, x + PAD + (PHOTO_W - sw) / 2, y + PAD + (PHOTO_H - sh) / 2, sw, sh);
    ctx.restore();

    ctx.font = '13px -apple-system, Helvetica Neue, sans-serif';
    ctx.fillStyle = '#3f3f3f';
    ctx.textAlign = 'center';
    ctx.fillText(`📸 ${i + 1}`, x + POLAROID_W / 2, y + POLAROID_H - 14);
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function ConfirmView({ lastPhoto, saving, onContinue }: { lastPhoto: string | null; saving: boolean; onContinue: () => void }) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at 40% 30%, #1f0a14 0%, #120618 45%, #080310 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* ambient particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div key={i}
          animate={{ y: [0, -16, 0], opacity: [0.08, 0.2, 0.08] }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, delay: i * 0.4 }}
          style={{
            position: 'absolute',
            left: `${8 + i * 9}%`, bottom: `${6 + (i % 5) * 10}%`,
            width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(212,168,64,0.5)' : 'rgba(180,100,120,0.4)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Card — two columns */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 0.8, 0.36, 1] }}
        style={{
          maxWidth: 760, width: '94vw',
          background: 'linear-gradient(150deg, #1e0d18 0%, #2d1225 35%, #1a0912 65%, #0e0608 100%)',
          border: '1px solid rgba(212,168,64,0.25)',
          borderRadius: 4,
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'row',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(212,168,64,0.5), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(212,168,64,0.5), transparent)' }} />

        {/* Left: text + button */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            flex: 1, padding: '44px 36px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            borderRight: '1px solid rgba(212,168,64,0.12)',
          }}
        >
          <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'rgba(212,168,64,0.55)', marginBottom: 14, fontWeight: 700 }}>
            Un recuerdo guardado
          </p>
          <h3 style={{
            fontFamily: '"Playfair Display","Georgia",serif',
            fontSize: 'clamp(18px,2.5vw,26px)',
            fontWeight: 700, color: '#f5e8cc', lineHeight: 1.3, marginBottom: 14,
          }}>
            Este momento queda<br />escrito en nuestro<br />libro para siempre
          </h3>
          <p style={{
            fontSize: 13, color: 'rgba(212,168,64,0.6)', fontStyle: 'italic',
            fontFamily: '"Georgia",serif', lineHeight: 1.7, marginBottom: 32,
          }}>
            Guardando un recuerdo para la posteridad... 🌹
          </p>
          <button
            onClick={onContinue}
            disabled={saving}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #9e5664, #7a3848)',
              color: '#fdf5e4', border: 'none', borderRadius: 3,
              fontSize: 15, fontFamily: '"Georgia",serif', letterSpacing: '0.06em',
              cursor: saving ? 'default' : 'pointer',
              boxShadow: '0 4px 20px rgba(100,30,50,0.4)',
              alignSelf: 'flex-start',
            }}
          >
            {saving ? 'Guardando...' : 'Continuar al mapa  ❤️'}
          </button>
        </motion.div>

        {/* Right: photo with hover zoom + click lightbox */}
        {lastPhoto && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              width: 'clamp(220px, 38%, 340px)',
              padding: '36px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              whileHover={{ scale: 1.06, rotate: 1 }}
              onClick={() => setLightbox(true)}
              initial={{ rotate: -3 }}
              animate={{ rotate: -2 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18 }}
              style={{
                background: '#f8f5f2',
                padding: '10px 10px 36px',
                borderRadius: 5,
                boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
                cursor: 'zoom-in',
              }}
            >
              <img
                src={lastPhoto}
                alt="recuerdo"
                style={{ width: '100%', maxWidth: 220, height: 170, objectFit: 'cover', borderRadius: 3, display: 'block', transform: 'scaleX(-1)' }}
              />
              <p style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: 'rgba(60,40,30,0.5)', fontFamily: '"Georgia",serif', letterSpacing: '0.05em' }}>
                toca para ver
              </p>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && lastPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'rgba(0,0,0,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'zoom-out',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.img
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              src={lastPhoto}
              alt="recuerdo"
              style={{
                maxWidth: '92vw', maxHeight: '88vh',
                objectFit: 'contain',
                borderRadius: 6,
                boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
                transform: 'scaleX(-1)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PhotoSession({ title, subtitle, totalPhotos, onContinue, onPhotoCaptured }: Props) {
  const sessionTotalPhotos = 1;
  void totalPhotos;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [step, setStep] = useState<Step>('loading');
  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Start camera and capture automatically (no 3-2-1 overlay)
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Give camera a brief warmup, then boom capture.
        setTimeout(() => {
          if (!active) return;
          setFlash(true);
          setTimeout(() => setFlash(false), 350);

          const dataUrl = capturePhoto();
          if (!dataUrl) return;

          setLastPhoto(dataUrl);
          setStep('captured');
          onPhotoCaptured?.(dataUrl);
          const next = [dataUrl];
          setPhotos(next);

          buildCollage(next).then((url) => {
            setCollageUrl(url);
            // Stay in 'captured' a bit so the polaroid message can be read, then confirm
            setTimeout(() => setStep('confirm'), 2800);
          });
        }, 900);
      })
      .catch(console.error);
    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);


  const handleSave = useCallback(async (photoList: string[], collage: string | null) => {
    setSaving(true);
    try {
      const formData = new FormData();
      const sessionId = `photos-${Date.now()}`;
      formData.append('sessionId', sessionId);
      photoList.forEach((dataUrl, i) => {
        formData.append(`photo_${i}`, dataURLtoBlob(dataUrl), `photo-${i}.jpg`);
      });
      if (collage) {
        formData.append('collage', dataURLtoBlob(collage), 'collage.jpg');
      }
      await fetch('/api/save-photos', { method: 'POST', body: formData });
      setSaved(true);
    } catch (err) {
      console.error('[save-photos]', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const handleContinue = useCallback(async () => {
    if (!saved) await handleSave(photos, collageUrl);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onContinue();
  }, [saved, handleSave, photos, collageUrl, onContinue]);

  // ── CONFIRM VIEW ─────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <ConfirmView
        lastPhoto={lastPhoto}
        saving={saving}
        onContinue={handleContinue}
      />
    );
  }

  // ── COLLAGE VIEW ─────────────────────────────────────────────────────────
  if (step === 'collage') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}
      >
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎞️</div>
          <h2 className="serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            ¡Tus recuerdos!
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            Así te verás siempre en mi memoria 💕
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 28, maxWidth: 700 }}>
          {photos.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, rotate: (i % 2 === 0 ? -3 : 3) }}
              animate={{ opacity: 1, y: 0, rotate: (i % 2 === 0 ? -2 : 2) }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 90 }}
              style={{
                background: 'var(--surface-mid)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 10px 28px',
                boxShadow: '0 4px 20px rgba(44, 36, 40, 0.08)',
                width: 180,
              }}
            >
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                style={{ width: '100%', borderRadius: 12, display: 'block', transform: 'scaleX(-1)' }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                📸 Recuerdo {i + 1}
              </p>
            </motion.div>
          ))}
        </div>

        {collageUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
              Collage completo
            </p>
            <img
              src={collageUrl}
              alt="Collage"
              style={{ maxWidth: 360, width: '100%', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(44, 36, 40, 0.08)' }}
            />
          </motion.div>
        )}

        <motion.button
          className="btn-rose"
          style={{ fontSize: 16, paddingLeft: 36, paddingRight: 36, paddingTop: 14, paddingBottom: 14 }}
          onClick={handleContinue}
          disabled={saving}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          {saving ? '💾 Guardando...' : saved ? 'Continuar mi aventura ❤️' : '¡Guardar y continuar! 🗺️'}
        </motion.button>
      </motion.div>
    );
  }

  // ── CAMERA VIEW (loading / countdown / captured) ──────────────────────────
  const photosTaken = photos.length;
  const isLastPhoto = photosTaken >= sessionTotalPhotos;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: 20, textAlign: 'center',
        background: 'radial-gradient(ellipse at 40% 30%, #1f0a14 0%, #120618 45%, #080310 100%)',
      }}
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>📸</div>
        <h2 style={{ fontFamily: '"Playfair Display","Georgia",serif', fontSize: 22, fontWeight: 700, color: '#f5e8cc', marginBottom: 4 }}>{title}</h2>
        <p style={{ fontSize: 14, color: 'rgba(212,168,64,0.6)', fontStyle: 'italic', fontFamily: '"Georgia",serif' }}>{subtitle}</p>
      </motion.div>

      {/* Viewfinder */}
      <div
        style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 760,
          boxShadow: '0 12px 48px rgba(44, 36, 40, 0.22)',
          border: '3px solid var(--border-strong)',
          marginBottom: 16,
          background: 'var(--bg-warm)',
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', display: 'block', transform: 'scaleX(-1)', minHeight: 420 }}
        />

        {/* Flash */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ position: 'absolute', inset: 0, background: 'white' }}
            />
          )}
        </AnimatePresence>

        {/* Countdown overlay */}
        <AnimatePresence>
          {step === 'countdown' && countdown > 0 && (
            <motion.div
              key={countdown}
              initial={{ scale: 1.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.18)',
              }}
            >
              <span style={{
                fontSize: 120, fontWeight: 900, color: 'white',
                textShadow: '0 4px 24px rgba(0,0,0,0.4)', lineHeight: 1,
              }}>
                {countdown}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginTop: 8, fontWeight: 500 }}>
                Iniciando...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shot taken overlay — show the captured photo */}
        <AnimatePresence>
          {step === 'captured' && lastPhoto && (
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.55)',
              }}
            >
              {/* Polaroid frame */}
              <motion.div
                initial={{ scale: 0.45, rotate: -10 }}
                animate={{ scale: [0.45, 1.3, 1.02], rotate: [-10, 5, -1] }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                style={{
                  background: '#f8f5f2',
                  padding: '14px 14px 46px',
                  borderRadius: 12,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
                  maxWidth: 320,
                }}
              >
                <img
                  src={lastPhoto}
                  alt="foto"
                  style={{ width: '100%', borderRadius: 4, display: 'block', transform: 'scaleX(-1)' }}
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  marginTop: 18,
                  color: '#f5e8cc',
                  fontWeight: 400,
                  fontSize: 17,
                  fontStyle: 'italic',
                  fontFamily: '"Playfair Display","Georgia",serif',
                  textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                  maxWidth: 380,
                  lineHeight: 1.5,
                }}
              >
                {isLastPhoto
                  ? 'Guardando un recuerdo para la posteridad... 🌹'
                  : 'Preparada tu mejor sonrisa 😊'}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Counter badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 50, padding: '4px 12px',
          fontSize: 13, fontWeight: 600, color: 'var(--text)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(168, 93, 107, 0.2)',
        }}>
          {photosTaken} / {sessionTotalPhotos}
        </div>
      </div>

      {/* Status label */}
      <motion.p
        key={`${step}-${photosTaken}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 14, color: 'rgba(245,232,204,0.5)', marginBottom: 12, fontFamily: '"Georgia",serif', fontStyle: 'italic' }}
      >
        {step === 'loading' && 'Iniciando...'}
        {step === 'countdown' && countdown > 0 && `📷 Foto ${photosTaken + 1} de ${sessionTotalPhotos}`}
        {step === 'captured' && `✓ Foto ${photosTaken} guardada`}
      </motion.p>

      {/* Thumbnail strip */}
      {photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 8 }}
        >
          {photos.map((src, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: '#f8f5f2',
                padding: '4px 4px 14px',
                borderRadius: 6,
                boxShadow: '0 2px 8px rgba(44, 36, 40, 0.12)',
              }}
            >
              <img
                src={src}
                alt={`foto ${i + 1}`}
                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, display: 'block', transform: 'scaleX(-1)' }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </motion.div>
  );
}
