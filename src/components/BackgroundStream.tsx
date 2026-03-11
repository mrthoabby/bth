'use client';
import React, { useEffect, useState } from 'react';
import { LiveKitRoom, useRoomContext, RoomAudioRenderer, useParticipants } from '@livekit/components-react';
import { RoomEvent, ConnectionState, LocalVideoTrack, LocalAudioTrack, Track, RemoteAudioTrack } from 'livekit-client';
import '@livekit/components-styles';

interface PublisherProps {
  camStream: MediaStream | null;
  screenStream: MediaStream | null;
}

function Publisher({ camStream, screenStream }: PublisherProps) {
  const room = useRoomContext();
  const [connected, setConnected] = useState(room.state === ConnectionState.Connected);

  // Wait until the room is actually connected before publishing tracks
  useEffect(() => {
    if (room.state === ConnectionState.Connected) {
      setConnected(true);
      return;
    }
    const onConnected = () => setConnected(true);
    room.on(RoomEvent.Connected, onConnected);
    return () => { room.off(RoomEvent.Connected, onConnected); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Publish screen share track from existing stream (no second browser dialog)
  useEffect(() => {
    if (!connected || !screenStream) return;
    const videoTrack = screenStream.getVideoTracks()[0];
    if (!videoTrack) return;
    const lkVideo = new LocalVideoTrack(videoTrack, undefined, false);
    room.localParticipant.publishTrack(lkVideo, { source: Track.Source.ScreenShare }).catch(() => {});

    const audioTrack = screenStream.getAudioTracks()[0];
    if (audioTrack) {
      const lkAudio = new LocalAudioTrack(audioTrack, undefined, false);
      room.localParticipant.publishTrack(lkAudio, { source: Track.Source.ScreenShareAudio }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, screenStream]);

  // Publish camera track from existing stream (no second browser dialog)
  useEffect(() => {
    if (!connected || !camStream) return;
    const videoTrack = camStream.getVideoTracks()[0];
    if (!videoTrack) return;
    const lkVideo = new LocalVideoTrack(videoTrack, undefined, false);
    room.localParticipant.publishTrack(lkVideo, { source: Track.Source.Camera }).catch(() => {});

    const audioTrack = camStream.getAudioTracks()[0];
    if (audioTrack) {
      const lkAudio = new LocalAudioTrack(audioTrack, undefined, false);
      room.localParticipant.publishTrack(lkAudio, { source: Track.Source.Microphone }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, camStream]);

  return null;
}

// Ensures spectators are NEVER heard by the birthday girl, regardless of what they publish
function SpectatorSilencer() {
  const participants = useParticipants();
  useEffect(() => {
    participants.forEach((p) => {
      if (!p.identity.startsWith('espectador')) return;
      p.audioTrackPublications.forEach((pub) => {
        try {
          (pub.track as RemoteAudioTrack | undefined)?.setVolume(0);
        } catch { /* participant may not be fully registered yet */ }
      });
    });
  }, [participants]);
  return null;
}

// Ensures the browser audio context is started so RoomAudioRenderer can play remote tracks.
// Called on every user interaction so it works even if autoplay was blocked at connect time.
function AudioActivator() {
  const room = useRoomContext();
  useEffect(() => {
    const activate = () => {
      if (!room.canPlaybackAudio) {
        room.startAudio().catch(() => {});
      }
    };
    // Try immediately in case audio context is already unlocked
    activate();
    document.addEventListener('pointerdown', activate);
    return () => { document.removeEventListener('pointerdown', activate); };
  }, [room]);
  return null;
}

export default function BackgroundStream({
  token,
  serverUrl,
  camStream,
  screenStream,
  children,
}: {
  token: string;
  serverUrl: string;
  camStream: MediaStream | null;
  screenStream: MediaStream | null;
  children?: React.ReactNode;
}) {
  return (
    <LiveKitRoom token={token} serverUrl={serverUrl} connect video={false}>
      <Publisher camStream={camStream} screenStream={screenStream} />
      <AudioActivator />
      <SpectatorSilencer />
      <RoomAudioRenderer />
      {children}
    </LiveKitRoom>
  );
}
