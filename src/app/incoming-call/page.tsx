'use client';
import dynamic from 'next/dynamic';
import RosePetals from '@/components/RosePetals';

// Dynamic import to avoid SSR issues with LiveKit + MediaDevices
const IncomingCallPanel = dynamic(() => import('@/components/IncomingCallPanel'), { ssr: false });

export default function IncomingCallPage() {
  return (
    <main className="romantic-bg relative">
      <RosePetals count={10} />
      <IncomingCallPanel />
    </main>
  );
}
