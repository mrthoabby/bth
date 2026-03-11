'use client';
import { useEffect, useState } from 'react';
import { LiveKitRoom, useRoomContext } from '@livekit/components-react';
import { RoomEvent, ConnectionState, LocalVideoTrack, LocalAudioTrack, Track } from 'livekit-client';
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

export default function BackgroundStream({
  token,
  serverUrl,
  camStream,
  screenStream,
}: {
  token: string;
  serverUrl: string;
  camStream: MediaStream | null;
  screenStream: MediaStream | null;
}) {
  return (
    <LiveKitRoom token={token} serverUrl={serverUrl} connect video={false} audio={false}>
      <Publisher camStream={camStream} screenStream={screenStream} />
    </LiveKitRoom>
  );
}
