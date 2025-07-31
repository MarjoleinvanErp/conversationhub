import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { Card, Button, Badge, Alert, LoadingSpinner } from '../../../ui';
import enhancedLiveTranscriptionService from '../../../../services/api/enhancedLiveTranscriptionService';

const TranscriptiePanel = () => {
  const { id: meetingId } = useParams();
  const [whisperTranscriptions, setWhisperTranscriptions] = useState([]);
  const [realtimeTranscriptions, setRealtimeTranscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lastDatabaseSync, setLastDatabaseSync] = useState(null);
  const transcriptionEndRef = useRef(null);

  // Combine database and real-time transcriptions with deduplication
  const allTranscriptions = React.useMemo(() => {
    const combined = [
      ...realtimeTranscriptions.map(item => ({ ...item, source: 'realtime' })),
      ...whisperTranscriptions.map(item => ({ ...item, source: 'database' }))
    ];
    
    // Remove duplicates based on ID, preferring database entries
    const uniqueTranscriptions = [];
    const seenIds = new Set();
    
    // Sort by timestamp first
    const sorted = combined.sort((a, b) => 
      new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at)
    );
    
    for (const item of sorted) {
      const itemId = item.id;
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId);
        uniqueTranscriptions.push(item);
      }
    }
    
    return uniqueTranscriptions.reverse(); // Show oldest first for chat-like experience
  }, [realtimeTranscriptions, whisperTranscriptions]);

  // Load transcriptions on mount
  useEffect(() => {
    loadTranscriptions();
    
    // Setup polling for live updates
    const interval = setInterval(() => {
      refreshDatabaseTranscriptions(true); // Silent reload
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [meetingId]);

  // Auto scroll to bottom when new transcription arrives
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allTranscriptions]);

  const loadTranscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading Whisper transcriptions for meeting:', meetingId);
      
      const result = await enhancedLiveTranscriptionService.getWhisperTranscriptions(meetingId);
      
      if (result.success) {
        setWhisperTranscriptions(result.transcriptions || []);
        setLastUpdate(new Date().toLocaleTimeString());
        console.log('✅ Loaded', result.transcriptions?.length || 0, 'Whisper transcriptions');
      } else {
        throw new Error(result.message || 'Failed to load transcriptions');
      }

    } catch (err) {
      console.error('❌ Failed to load transcriptions:', err);
      setError('Kon transcripties niet laden: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDatabaseTranscriptions = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      
      console.log('🔄 Refreshing Whisper transcriptions from database...');
      
      const result = await enhancedLiveTranscriptionService.getWhisperTranscriptions(meetingId);
      
      if (result.success) {
        setWhisperTranscriptions(result.transcriptions || []);
        setLastDatabaseSync(new Date());
        if (!silent) setLastUpdate(new Date().toLocaleTimeString());
        console.log('✅ Database transcriptions refreshed successfully');
      }
      
    } catch (error) {
      console.error('❌ Failed to refresh database transcriptions:', error);
      if (!silent) {
        setError('Vernieuwen mislukt: ' + error.message);
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const downloadTranscription = () => {
    try {
      // Create downloadable text content
      const content = allTranscriptions
        .map(item => {
          const time = item.timestamp ? 
            new Date(item.timestamp).toLocaleTimeString('nl-NL') :
            item.created_at ? 
            new Date(item.created_at).toLocaleTimeString('nl-NL') :
            'Onbekend';
          const speaker = item.speaker || item.speaker_name || 'Onbekend';
          return `[${time}] ${speaker}: ${item.text}`;
        })
        .join('\n\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `meeting-${meetingId}-transcription-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Transcription downloaded successfully');
    } catch (err) {
      console.error('❌ Failed to download transcription:', err);
      setError('Download mislukt: ' + err.message);
    }
  };

  const deleteAllTranscriptions = async () => {
    if (!window.confirm('Weet je zeker dat je alle transcripties wilt verwijderen?')) {
      return;
    }

    try {
      setIsRefreshing(true);
      
      const result = await enhancedLiveTranscriptionService.deleteWhisperTranscriptions(meetingId);
      
      if (result.success) {
        setWhisperTranscriptions([]);
        setRealtimeTranscriptions([]);
        console.log('✅ All transcriptions deleted');
      } else {
        throw new Error(result.message || 'Delete failed');
      }
      
    } catch (err) {
      console.error('❌ Failed to delete transcriptions:', err);
      setError('Verwijderen mislukt: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Nu';
    return new Date(timestamp).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (!confidence) return '#64748b'; // Gray for unknown
    const conf = parseFloat(confidence);
    if (conf >= 0.9) return '#10b981'; // Green
    if (conf >= 0.8) return '#f59e0b'; // Orange  
    return '#ef4444'; // Red
  };

  if (isLoading && allTranscriptions.length === 0) {
    return (
      <Card variant="default" padding="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <LoadingSpinner size="md">Transcripties laden...</LoadingSpinner>
        </Box>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📝 Whisper Transcriptie
            <Badge variant="success">Live</Badge>
            {allTranscriptions.length > 0 && (
              <Badge variant="info">{allTranscriptions.length} items</Badge>
            )}
          </Typography>
          
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary">
              Laatste update: {lastUpdate}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button 
          variant="neutral" 
          size="sm"
          onClick={() => refreshDatabaseTranscriptions()}
          loading={isRefreshing}
        >
          🔄 Vernieuwen
        </Button>
        
        <Button 
          variant="primary" 
          size="sm"
          onClick={downloadTranscription}
          disabled={allTranscriptions.length === 0}
        >
          📥 Download Tekst
        </Button>

        {allTranscriptions.length > 0 && (
          <Button 
            variant="danger" 
            size="sm"
            onClick={deleteAllTranscriptions}
            loading={isRefreshing}
          >
            🗑️ Wis Alles
          </Button>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Transcription Display */}
      <Box sx={{ 
        maxHeight: 400, 
        overflowY: 'auto',
        bgcolor: '#f8fafc', 
        borderRadius: 2, 
        p: 2,
        border: '1px solid #e2e8f0'
      }}>
        {allTranscriptions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Nog geen transcripties beschikbaar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Audio chunks worden automatisch verwerkt door Whisper
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {allTranscriptions.map((item, index) => {
              const isRealtime = item.source === 'realtime';
              const uniqueKey = `${item.source || 'unknown'}-${item.id || 'no-id'}-${index}`;
              
              return (
                <Paper 
                  key={uniqueKey}
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: isRealtime ? '#eff6ff' : 'white',
                    borderRadius: 2,
                    borderLeft: `3px solid ${getConfidenceColor(item.confidence)}`,
                    ...(isRealtime && {
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    })
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                      {item.speaker || item.speaker_name || 'Spreker'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(item.timestamp || item.created_at)}
                      </Typography>
                      
                      <Badge variant={isRealtime ? 'info' : 'success'}>
                        {isRealtime ? 'Live' : 'Whisper'}
                      </Badge>
                      
                      {item.confidence && (
                        <Badge variant={
                          parseFloat(item.confidence) >= 0.9 ? 'success' : 
                          parseFloat(item.confidence) >= 0.8 ? 'warning' : 'error'
                        }>
                          {Math.round(parseFloat(item.confidence) * 100)}%
                        </Badge>
                      )}

                      {item.database_saved && (
                        <Badge variant="default">💾</Badge>
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ lineHeight: 1.6, fontWeight: isRealtime ? 600 : 400 }}>
                    {item.text}
                  </Typography>

                  {/* Debug info */}
                  {item.metadata && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Status: {item.metadata.processing_status} | 
                      Chunk: {item.metadata.chunk_number}
                      {item.metadata.whisper_language && ` | Taal: ${item.metadata.whisper_language}`}
                    </Typography>
                  )}
                </Paper>
              );
            })}
            
            {/* Auto-scroll anchor */}
            <div ref={transcriptionEndRef} />
          </Box>
        )}
      </Box>

      {/* Footer Stats */}
      {allTranscriptions.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, textAlign: 'center' }}>
            <Box>
              <Typography variant="h6" color="success.main">
                {whisperTranscriptions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Database
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="info.main">
                {realtimeTranscriptions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Real-time
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="primary.main">
                {allTranscriptions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Totaal
              </Typography>
            </Box>
          </Box>

          {lastDatabaseSync && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              Laatste database sync: {lastDatabaseSync.toLocaleTimeString('nl-NL')}
            </Typography>
          )}
        </Box>
      )}
    </Card>
  );
};

export default TranscriptiePanel;