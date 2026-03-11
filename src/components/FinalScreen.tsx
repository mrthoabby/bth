'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RecordingState } from '@/hooks/useRecording';

interface Props { message: string; subMessage: string; recordingState: RecordingState; onStopRecording: () => void; }

export default function FinalScreen({ message, subMessage, recordingState, onStopRecording }: Props) {
  useEffect(() => {
    if (recordingState === 'recording') onStopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'40px 24px', textAlign:'center' }}
    >
      <motion.div initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:70, delay:0.15 }}
        style={{ fontSize:44, marginBottom:24, opacity:0.9 }}>
        💝
      </motion.div>

      <motion.h1
        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
        className="serif glow-text"
        style={{ fontSize:'clamp(26px,5vw,40px)', fontWeight:400, color:'var(--text)', letterSpacing:'-0.01em', marginBottom:10 }}
      >
        Para siempre
      </motion.h1>

      <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.6, duration:0.5 }}
        className="divider" style={{ marginBottom:28 }} />

      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.85 }}
        style={{ maxWidth:440, width:'100%', marginBottom:36,
          borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'28px 16px' }}
      >
        <p style={{ fontSize:18, color:'var(--text)', lineHeight:1.75, marginBottom:14, fontWeight:400 }}>
          {message}
        </p>
        <p style={{ fontSize:14, color:'var(--text-muted)', fontStyle:'italic' }}>
          {subMessage}
        </p>
      </motion.div>

      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.2 }}
        style={{ display:'flex', gap:16, fontSize:18, marginBottom:28, opacity:0.4 }}>
        {['❤','🌹','♡','🌸','❤','♡','🌹'].map((e,i) => (
          <motion.span key={i} animate={{ y:[0,-8,0], scale:[1,1.08,1] }} transition={{ delay:i*0.14, repeat:Infinity, duration:2.2 }}>
            {e}
          </motion.span>
        ))}
      </motion.div>

      <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }}
        style={{ fontSize:11, color:'var(--text-dim)', letterSpacing:'0.05em' }}>
        {recordingState === 'recording' && '· guardando recuerdo'}
        {recordingState === 'done'      && '· recuerdo guardado'}
        {recordingState === 'error'     && '· no se pudo guardar la grabación'}
      </motion.p>
    </motion.div>
  );
}
