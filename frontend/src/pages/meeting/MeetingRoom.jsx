import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import EnhancedLiveTranscription from '../../components/recording/EnhancedLiveTranscription.jsx';
import BasicAudioUploader from '../../components/recording/AudioRecorder/BasicAudioUploader.jsx';
import { useMeetingHandlers } from './hooks/useMeetingHandlers.js';
import { getSpeakerColor } from './utils/meetingUtils.js';

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Meeting data
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transcription state
  const [transcriptions, setTranscriptions] = useState([]);
  const [transcriptionMode, setTranscriptionMode] = useState('enhanced');

  // Speaker state
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [speakerStats, setSpeakerStats] = useState({});

  // Agenda tracking
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

  // Load meeting
  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    try {
      const result = await meetingService.getMeeting(id);
      if (result.success) {
        setMeeting(result.data);
        await loadTranscriptions();
      } else {
        setError('Gesprek niet gevonden');
      }
    } catch (error) {
      setError('Fout bij laden gesprek');
    } finally {
      setLoading(false);
    }
  };

  const loadTranscriptions = async () => {
    try {
      const result = await transcriptionService.getTranscriptions(id);
      if (result.success) {
        const dbTranscriptions = result.data.map(t => ({
          id: t.id,
          text: t.text,
          timestamp: new Date(t.spoken_at),
          speaker: t.speaker_name,
          speakerId: t.speaker_id,
          speakerColor: t.speaker_color,
          confidence: parseFloat(t.confidence),
          source: 'database'
        }));
        setTranscriptions(dbTranscriptions);
      }
    } catch (error) {
      console.error('Failed to load transcriptions:', error);
    }
  };

  // Get handlers
  const handlers = useMeetingHandlers({
    id,
    transcriptions,
    setTranscriptions,
    currentSpeaker,
    setCurrentSpeaker,
    availableSpeakers,
    setAvailableSpeakers,
    speakerStats,
    setSpeakerStats,
    currentAgendaIndex,
    setCurrentAgendaIndex,
    agendaStartTimes,
    setAgendaStartTimes,
    meeting
  });

  // Handle transcription updates
  const handleTranscriptionUpdate = (transcriptionData) => {
    handlers.handleTranscriptionReceived(transcriptionData);
  };

  const finishMeeting = async () => {
    try {
      await meetingService.stopMeeting(id);
      navigate('/dashboard');
    } catch (error) {
      setError('Fout bij afsluiten gesprek');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column' 
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>❌</div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Fout</h2>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn-primary"
        >
          Terug naar Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="meeting-room-container">
      {/* Header */}
      <div className="meeting-room-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {meeting?.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                <span>🆔 {id}</span>
                <span>👥 {meeting?.participants?.length || 0} deelnemers</span>
                <span>📝 {transcriptions.length} transcripties</span>
              </div>
            </div>

            {/* Transcriptie Mode Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                🎤 Transcriptie:
              </label>
              <select 
                value={transcriptionMode} 
                onChange={(e) => setTranscriptionMode(e.target.value)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="enhanced">🎯 Live Transcriptie</option>
                <option value="manual">🎤 Handmatige Opname</option>
                <option value="none">⏸️ Geen Transcriptie</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn-neutral"
            >
              🏠 Dashboard
            </button>
            <button 
              onClick={finishMeeting} 
              className="btn-danger"
            >
              ⏹️ Stop Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="meeting-room-content">
        
        {/* LINKS: Transcriptie Gebied */}
        <div className="meeting-room-main">
          
          {/* Transcriptie Component */}
          <div className="meeting-room-transcription">
            {transcriptionMode === 'enhanced' && (
              <div style={{ 
                height: '100%', 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  padding: '16px', 
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px 12px 0 0'
                }}>
                  <h3 style={{ 
                    fontWeight: '500', 
                    color: '#1f2937', 
                    margin: 0,
                    fontSize: '1rem'
                  }}>
                    🎯 Live Transcriptie
                  </h3>
                </div>
                <div style={{ flex: 1, padding: '24px', overflow: 'hidden' }}>
                  <EnhancedLiveTranscription
                    meetingId={parseInt(id)}
                    participants={meeting?.participants || []}
                    onTranscriptionUpdate={handleTranscriptionUpdate}
                    onSessionStatsUpdate={(stats) => console.log('Session stats:', stats)}
                  />
                </div>
              </div>
            )}

            {transcriptionMode === 'manual' && (
              <div style={{ 
                height: '100%', 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  padding: '16px', 
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px 12px 0 0'
                }}>
                  <h3 style={{ 
                    fontWeight: '500', 
                    color: '#1f2937', 
                    margin: 0,
                    fontSize: '1rem'
                  }}>
                    🎤 Handmatige Audio Opname
                  </h3>
                </div>
                <div style={{ padding: '24px' }}>
                  <BasicAudioUploader
                    onTranscriptionReceived={handleTranscriptionUpdate}
                    meetingId={parseInt(id)}
                  />
                </div>
              </div>
            )}

            {transcriptionMode === 'none' && (
              <div style={{ 
                height: '100%', 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📝</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Handmatige Notities
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    Kies een transcriptie optie in de header om te beginnen met opnemen.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Gespreksverslag */}
          <div className="meeting-room-transcript-log">
            <h3 style={{ 
              fontWeight: '500', 
              color: '#1f2937', 
              marginBottom: '12px',
              fontSize: '1rem'
            }}>
              💬 Gespreksverslag ({transcriptions.length})
            </h3>
            {transcriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Nog geen gesprekstekst</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transcriptions
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, 5)
                  .map((transcription, index) => (
                    <div 
                      key={transcription.id || index} 
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px'
                      }}
                    >
                      <div 
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: transcription.speakerColor || '#6B7280',
                          marginTop: '4px',
                          flexShrink: 0
                        }}
                      ></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ 
                            fontWeight: '500', 
                            fontSize: '0.875rem', 
                            color: '#1f2937' 
                          }}>
                            {transcription.speaker || 'Audio Upload'}
                          </span>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280' 
                          }}>
                            {new Date(transcription.timestamp).toLocaleTimeString('nl-NL')}
                          </span>
                        </div>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#111827', 
                          lineHeight: '1.5',
                          margin: 0
                        }}>
                          {transcription.text}
                        </p>
                      </div>
                    </div>
                  ))}
                {transcriptions.length > 5 && (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      ... en {transcriptions.length - 5} meer
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RECHTS: Sidebar */}
        <div className="meeting-room-sidebar">
          
          {/* Agenda Sectie */}
          <div className="meeting-room-sidebar-section" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <div className="meeting-room-sidebar-header">
              <h3 style={{ 
                fontWeight: '500', 
                color: '#1f2937', 
                margin: 0,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📝</span>
                <span>Agenda ({meeting?.agenda_items?.length || 0})</span>
              </h3>
            </div>
            
            <div className="meeting-room-sidebar-content">
              {meeting?.agenda_items?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {meeting.agenda_items.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handlers.handleGoToAgendaItem(index)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${
                          index === currentAgendaIndex
                            ? '#3b82f6'
                            : index < currentAgendaIndex
                            ? '#10b981'
                            : '#d1d5db'
                        }`,
                        backgroundColor: 
                          index === currentAgendaIndex
                            ? '#eff6ff'
                            : index < currentAgendaIndex
                            ? '#ecfdf5'
                            : '#f9fafb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (index > currentAgendaIndex) {
                          e.target.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (index > currentAgendaIndex) {
                          e.target.style.backgroundColor = '#f9fafb';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: 
                            index === currentAgendaIndex
                              ? '#bfdbfe'
                              : index < currentAgendaIndex
                              ? '#bbf7d0'
                              : '#e5e7eb',
                          color:
                            index === currentAgendaIndex
                              ? '#1e40af'
                              : index < currentAgendaIndex
                              ? '#065f46'
                              : '#374151'
                        }}>
                          {index + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '500', 
                            color: '#1f2937',
                            margin: 0,
                            marginBottom: '4px'
                          }}>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p style={{ 
                              fontSize: '0.75rem', 
                              color: '#6b7280',
                              margin: 0,
                              marginBottom: '4px'
                            }}>
                              {item.description}
                            </p>
                          )}
                          {item.estimated_duration && (
                            <p style={{ 
                              fontSize: '0.75rem', 
                              color: '#9ca3af',
                              margin: 0
                            }}>
                              ~{item.estimated_duration} min
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Agenda Navigatie */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    paddingTop: '12px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={handlers.handlePreviousAgendaItem}
                      disabled={currentAgendaIndex <= 0}
                      className="btn-neutral"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      ← Vorige
                    </button>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280', 
                      display: 'flex', 
                      alignItems: 'center' 
                    }}>
                      {currentAgendaIndex + 1} / {meeting.agenda_items.length}
                    </span>
                    <button
                      onClick={handlers.handleNextAgendaItem}
                      disabled={currentAgendaIndex >= meeting.agenda_items.length - 1}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      Volgende →
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '0.875rem', 
                  textAlign: 'center', 
                  padding: '16px' 
                }}>
                  Geen agenda items
                </p>
              )}
            </div>
          </div>

          {/* Deelnemers Sectie */}
          <div className="meeting-room-sidebar-section">
            <div className="meeting-room-sidebar-header">
              <h3 style={{ 
                fontWeight: '500', 
                color: '#1f2937', 
                margin: 0,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>👥</span>
                <span>Deelnemers ({meeting?.participants?.length || 0})</span>
              </h3>
            </div>
            
            <div className="meeting-room-sidebar-content">
              {meeting?.participants?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {meeting.participants.map((participant, index) => (
                    <div 
                      key={index} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '500',
                          fontSize: '0.875rem',
                          backgroundColor: getSpeakerColor(index + 1),
                          flexShrink: 0
                        }}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ 
                          fontWeight: '500', 
                          fontSize: '0.875rem', 
                          color: '#1f2937',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {participant.name}
                        </h4>
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: '#6b7280',
                          textTransform: 'capitalize',
                          margin: 0
                        }}>
                          {participant.role}
                        </p>
                        {participant.email && (
                          <p style={{ 
                            fontSize: '0.75rem', 
                            color: '#9ca3af',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {participant.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '0.875rem', 
                  textAlign: 'center', 
                  padding: '16px' 
                }}>
                  Geen deelnemers geregistreerd
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;