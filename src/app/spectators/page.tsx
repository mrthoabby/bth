'use client';
import dynamic from 'next/dynamic';
import RosePetals from '@/components/RosePetals';

const SpectatorRoom = dynamic(() => import('@/components/SpectatorRoom'), { ssr: false });

export default function SpectatorsPage() {
  return (
    <main className="romantic-bg" style={{ position: 'relative', minHeight: '100vh' }}>
      <RosePetals count={8} />
      <SpectatorRoom />
    </main>
  );
}
