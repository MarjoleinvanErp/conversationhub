// ConversationHub - Modern Meeting Room
// Updated layout: Agenda links, Audio rechts, Privacy disabled
import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, Box, Typography, Paper } from '@mui/material';

// Import alle panels
import AudioPanel from '../../components/features/meeting/AudioPanel';
import RapportPanel from '../../components/features/meeting/RapportPanel';
import TranscriptiePanel from '../../components/features/meeting/TranscriptiePanel';
import AgendaPanel from '../../components/features/meeting/AgendaPanel';
// import PrivacyPanel from '../../components/features/meeting/PrivacyPanel'; // Temporarily disabled
import ParticipantPanel from '../../components/features/meeting/ParticipantPanel';

const MeetingRoomModern = () => {
  const { id } = useParams();

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Meeting Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Meeting Room - ID: {id}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Intelligente gespreksondersteuning met real-time transcriptie
        </Typography>
      </Box>

      {/* Main Layout: Links/Rechts */}
      <Grid container spacing={3}>
        {/* LINKER KOLOM - Agenda, Rapport, Transcriptie */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Agenda Panel - Nu links */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <AgendaPanel />
            </Paper>

            {/* Rapport Panel */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <RapportPanel />
            </Paper>

            {/* Transcriptie Panel */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <TranscriptiePanel />
            </Paper>

          </Box>
        </Grid>

        {/* RECHTER KOLOM - Audio, Participant (Privacy tijdelijk uit) */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Audio Panel - Nu rechts */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <AudioPanel />
            </Paper>

            {/* Privacy Panel - Tijdelijk uitgeschakeld */}
            {/* 
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <PrivacyPanel />
            </Paper>
            */}

            {/* Participant Panel */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <ParticipantPanel />
            </Paper>

          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MeetingRoomModern;