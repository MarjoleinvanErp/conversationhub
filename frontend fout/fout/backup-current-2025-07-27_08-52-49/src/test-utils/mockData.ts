// frontend/src/test-utils/mockData.ts

import type { 
  N8NTranscriptionResponse,
  N8NSpeakerSegment,
  ProcessedTranscription 
} from '../types/n8n';

export const mockN8NResponse: N8NTranscriptionResponse = {
  transcription: 'Dit is een test transcriptie van N8N workflow',
  confidence: 0.95,
  processing_time_ms: 2500,
  speaker_analysis: {
    segments: [
      {
        text: 'Dit is spreker A',
        speaker: 'SPEAKER_00',
        speaker_confidence: 0.92,
        start: 0.0,
        end: 2.5,
        confidence: 0.94
      },
      {
        text: 'En dit is spreker B',
        speaker: 'SPEAKER_01',
        speaker_confidence: 0.89,
        start: 2.5,
        end: 5.0,
        confidence: 0.91
      }
    ]
  }
};

export const mockMultiSpeakerSegments: N8NSpeakerSegment[] = [
  {
    text: 'Goedemorgen, welkom bij deze vergadering',
    speaker: 'SPEAKER_00',
    speaker_confidence: 0.95,
    start: 0.0,
    end: 3.2,
    confidence: 0.96
  },
  {
    text: 'Dank je wel, ik ben blij hier te zijn',
    speaker: 'SPEAKER_01',
    speaker_confidence: 0.91,
    start: 3.5,
    end: 6.8,
    confidence: 0.93
  },
  {
    text: 'Laten we beginnen met de agenda',
    speaker: 'SPEAKER_00',
    speaker_confidence: 0.94,
    start: 7.0,
    end: 9.5,
    confidence: 0.95
  }
];

export const mockProcessedTranscriptions: ProcessedTranscription[] = [
  {
    id: 1,
    text: 'Dit is de eerste transcriptie',
    speaker_name: 'Spreker A',
    speaker_id: 'SPEAKER_00',
    speaker_color: '#3B82F6',
    confidence: 0.95,
    speaker_confidence: 0.92,
    spoken_at: '2025-01-20T10:00:00Z',
    source: 'n8n',
    processing_status: 'completed'
  },
  {
    id: 2,
    text: 'En dit is de tweede transcriptie',
    speaker_name: 'Spreker B',
    speaker_id: 'SPEAKER_01',
    speaker_color: '#EF4444',
    confidence: 0.91,
    speaker_confidence: 0.89,
    spoken_at: '2025-01-20T10:00:05Z',
    source: 'n8n',
    processing_status: 'completed'
  }
];