'use client';
import dynamic from 'next/dynamic';

const CallerPanel = dynamic(() => import('@/components/CallerPanel'), { ssr: false });

export default function CallerPage() {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', background: '#060b14' }}>
      <CallerPanel />
    </main>
  );
}
