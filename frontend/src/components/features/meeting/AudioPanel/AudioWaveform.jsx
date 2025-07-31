import React from 'react';
import { Box } from '@mui/material';

const AudioWaveform = ({ isRecording, audioLevel, isPaused }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <Box
          key={i}
          sx={{ 
            width: 4,
            height: isRecording ? `${Math.random() * audioLevel + 10}%` : '10%',
            backgroundColor: 
              isPaused ? '#f59e0b' :
              isRecording ? '#10b981' :
              '#e5e7eb',
            borderRadius: 1,
            transition: 'height 0.1s ease, background-color 0.2s ease'
          }}
        />
      ))}
    </Box>
  );
};

export default AudioWaveform;