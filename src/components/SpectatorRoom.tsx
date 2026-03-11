'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiveKitRoom,
  useRoomContext,
  useTracks,
  VideoTrack,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent } from 'livekit-client';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

// ─── Chat sidebar ─────────────────────────────────────────────────────────────
function ChatPanel({ myName }: { myName: string }) {
  const room = useRoomContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Receive messages from other participants
  useEffect(() => {
    const decoder = new TextDecoder();
    const handler = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(decoder.decode(payload)) as ChatMessage;
        if (msg.id) setMessages((prev) => [...prev, msg]);
      } catch { /* ignore malformed */ }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender: myName,
      text,
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    };
    // Add locally
    setMessages((prev) => [...prev, msg]);
    // Broadcast
    const encoder = new TextEncoder();
    room.localParticipant.publishData(encoder.encode(JSON.stringify(msg)), { reliable: true }).catch(() => {});
    setInput('');
  }, [input, myName, room]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  return (
    <div style={{
      width: 280, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(6,10,20,0.95)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Chat del momento 💬
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 20, fontStyle: 'italic' }}>
            Sé el primero en escribir ✨
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {!isMe && (
                <p style={{ fontSize: 10, color: 'rgba(212,168,64,0.75)', marginBottom: 2, marginLeft: 2 }}>
                  {msg.sender}
                </p>
              )}
              <div style={{
                background: isMe
                  ? 'linear-gradient(135deg, rgba(175,55,78,0.85), rgba(135,38,58,0.85))'
                  : 'rgba(255,255,255,0.08)',
                border: `1px solid ${isMe ? 'rgba(215,95,115,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                padding: '8px 12px',
              }}>
                <p style={{ fontSize: 13, color: isMe ? '#fff' : 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {msg.text}
                </p>
              </div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2, marginLeft: 2, textAlign: isMe ? 'right' : 'left' }}>
                {msg.time}
              </p>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', gap: 6,
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe algo..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          style={{
            background: input.trim() ? 'rgba(175,55,78,0.85)' : 'rgba(80,40,50,0.5)',
            border: 'none', borderRadius: 10, padding: '8px 12px',
            color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
            fontSize: 16, transition: 'background 0.15s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── Video grid ───────────────────────────────────────────────────────────────
function VideoGrid({ myName }: { myName: string }) {
  const participants = useParticipants();

  const camTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  // birthday girl's screen or camera shown in main area
  const birthdayScreen = screenTracks.find((t) => t.participant.identity.startsWith('birthday'));
  const remoteScreen = birthdayScreen ? [birthdayScreen] : screenTracks.filter((t) => !t.participant.isLocal && t.participant.identity !== 'caller-person');
  const birthdayCam = camTracks.find((t) => t.participant.identity.startsWith('birthday'));
  // spectator cams: exclude birthday girl AND caller admin
  const spectatorCams = camTracks.filter((t) =>
    !t.participant.identity.startsWith('birthday') && t.participant.identity !== 'caller-person'
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>

      {/* ── Main area: screen share full-width + birthday PiP overlay ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, background: '#050912' }}>

        {remoteScreen.length > 0 ? (
          /* Screen share — fills the whole area */
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <VideoTrack
              trackRef={remoteScreen[0]}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <div style={{
              position: 'absolute', top: 10, left: 12,
              fontSize: 10, color: 'rgba(180,180,255,0.7)',
              background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 7px',
            }}>
              🖥️ Pantalla compartida
            </div>
          </div>
        ) : (
          /* No screen share — show birthday cam centered or waiting */
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {birthdayCam ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <VideoTrack
                  trackRef={birthdayCam}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <p style={{ color: 'rgba(232,69,90,0.45)', fontSize: 14, textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 42, marginBottom: 10 }}>🎂</span>
                Esperando a la cumpleañera...
              </p>
            )}
          </div>
        )}

        {/* Birthday cam PiP — shown when screen share is active */}
        {remoteScreen.length > 0 && birthdayCam && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            width: 140, height: 100,
            borderRadius: 10, overflow: 'hidden',
            border: '2px solid rgba(232,69,90,0.7)',
            boxShadow: '0 0 18px rgba(232,69,90,0.35)',
            zIndex: 10,
          }}>
            <VideoTrack
              trackRef={birthdayCam}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
              fontSize: 9, color: 'rgba(255,200,210,0.9)',
              background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '1px 6px',
              whiteSpace: 'nowrap',
            }}>
              🎂 Cumpleañera
            </div>
          </div>
        )}

        {/* Participant count badge */}
        <div style={{
          position: 'absolute', top: 10, right: 12,
          fontSize: 10, color: 'rgba(255,255,255,0.5)',
          background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 8px',
        }}>
          {participants.length} conectado{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Spectator thumbnails strip ── */}
      {spectatorCams.length > 0 && (
        <div style={{
          flexShrink: 0,
          display: 'flex', gap: 6, padding: '6px 10px',
          background: 'rgba(0,0,0,0.6)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          overflowX: 'auto',
        }}>
          {spectatorCams.map((track) => {
            const name = track.participant.identity;
            const isMe = track.participant.isLocal;
            const displayName = isMe ? `Tú (${myName})` : name.replace(/^espectador-/, '');
            return (
              <div
                key={track.publication?.trackSid ?? name}
                style={{
                  width: 100, height: 72, borderRadius: 8, overflow: 'hidden',
                  background: '#0d0508', flexShrink: 0,
                  border: isMe ? '1.5px solid rgba(212,168,64,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                  position: 'relative',
                }}
              >
                <VideoTrack
                  trackRef={track}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 8, color: 'rgba(255,255,255,0.75)',
                  background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '1px 5px',
                  whiteSpace: 'nowrap', maxWidth: 88, overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {displayName}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Room inner ───────────────────────────────────────────────────────────────
function RoomInner({ myName }: { myName: string }) {
  const room = useRoomContext();

  useEffect(() => {
    // Camera on, mic OFF — spectators watch silently (chat only)
    room.localParticipant.setCameraEnabled(true).catch(() => {});
    room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050912', overflow: 'hidden' }}>
      <VideoGrid myName={myName} />
      <ChatPanel myName={myName} />
    </div>
  );
}

// ─── Name prompt ──────────────────────────────────────────────────────────────
function NamePrompt({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050912', flexDirection: 'column', gap: 20, padding: 24,
    }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3.5 }}
        style={{ fontSize: 64 }}
      >
        🎉
      </motion.div>
      <h1 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: 700, textAlign: 'center', margin: 0 }}>
        Sala de espectadores
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', margin: 0 }}>
        ¿Cómo quieres que te vean?
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onJoin(name.trim())}
        placeholder="Tu nombre..."
        autoFocus
        style={{
          background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.18)',
          borderRadius: 12, padding: '12px 18px', color: '#fff', fontSize: 16,
          outline: 'none', width: '100%', maxWidth: 320,
        }}
      />
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => name.trim() && onJoin(name.trim())}
        disabled={!name.trim()}
        style={{
          padding: '13px 36px',
          background: name.trim()
            ? 'linear-gradient(135deg, rgba(175,55,78,0.92), rgba(135,38,58,0.92))'
            : 'rgba(55,28,38,0.4)',
          border: `1.5px solid ${name.trim() ? 'rgba(215,95,115,0.6)' : 'rgba(110,55,65,0.25)'}`,
          borderRadius: 14, color: name.trim() ? '#fff' : 'rgba(190,140,155,0.4)',
          fontSize: 15, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default',
          boxShadow: name.trim() ? '0 4px 20px rgba(175,55,78,0.4)' : 'none',
        }}
      >
        Unirme al momento ❤️
      </motion.button>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function SpectatorRoom() {
  const [myName, setMyName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = useCallback(async (name: string) => {
    try {
      const res = await fetch(`/api/livekit-token?role=spectator&name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('No se pudo obtener el token');
      const data = await res.json();
      setToken(data.token);
      setServerUrl(data.url);
      setMyName(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050912' }}>
        <p style={{ color: 'rgba(232,69,90,0.8)' }}>{error}</p>
      </div>
    );
  }

  if (!myName || !token) {
    return <NamePrompt onJoin={handleJoin} />;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={true}
      audio={true}
    >
      <RoomInner myName={myName} />
    </LiveKitRoom>
  );
}
