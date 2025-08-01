import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Schedule as TimeIcon
} from '@mui/icons-material';
import { Card, Button, Alert, LoadingSpinner, Badge } from '../../../ui';

const RapportPanel = () => {
  const { id: meetingId } = useParams();
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // N8N webhook URLs - configureerbaar
  const N8N_BASE_URL = import.meta.env.VITE_N8N_URL || 'http://localhost:5678';
  const RAPPORT_WEBHOOK = `${N8N_BASE_URL}/webhook/rapport`;

  useEffect(() => {
    if (meetingId) {
      loadExistingReports();
    }
  }, [meetingId]);

  const loadExistingReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Loading existing reports for meeting:', meetingId);

      // TODO: Replace with actual API call to get existing reports
      // For now, simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock reports data
      const mockReports = [
        {
          id: 1,
          title: 'Gespreksverslag - Meeting ' + meetingId,
          created_at: new Date(Date.now() - 300000).toISOString(),
          status: 'completed',
          type: 'n8n_generated',
          sections: ['Samenvatting', 'Deelnemers', 'Belangrijkste punten', 'Actiepunten'],
          download_url: '#'
        }
      ];

      setReports(mockReports);
      console.log('✅ Loaded', mockReports.length, 'existing reports');

    } catch (err) {
      console.error('❌ Failed to load reports:', err);
      setError('Kon bestaande rapporten niet laden: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRapportViaWebhook = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🚀 Calling N8N webhook for rapport generation:', RAPPORT_WEBHOOK);

      const payload = {
        meetingId: meetingId,
        timestamp: new Date().toISOString(),
        requestType: 'generate_rapport',
        options: {
          includeTranscriptions: true,
          includeAgenda: true,
          includeParticipants: true,
          format: 'structured'
        }
      };

      const response = await fetch(RAPPORT_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ N8N webhook response:', result);

      if (result.success) {
        setSuccess('Rapport wordt gegenereerd! Dit kan enkele minuten duren.');
        
        // Simulate report generation completion
        setTimeout(() => {
          const newReport = {
            id: Date.now(),
            title: result.title || `Gespreksverslag - ${new Date().toLocaleDateString('nl-NL')}`,
            created_at: new Date().toISOString(),
            status: 'completed',
            type: 'n8n_generated',
            sections: result.sections || ['Samenvatting', 'Belangrijkste punten', 'Actiepunten'],
            content: result.content || null,
            download_url: result.download_url || null
          };

          setReports(prev => [newReport, ...prev]);
          setCurrentReport(newReport);
          setSuccess('Rapport succesvol gegenereerd!');
        }, 3000);

      } else {
        throw new Error(result.message || 'N8N webhook returned error');
      }

    } catch (err) {
      console.error('❌ Failed to generate rapport via N8N:', err);
      setError('Kon rapport niet genereren: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const viewReport = (report) => {
    setCurrentReport(report);
    setShowReportModal(true);
  };

  const downloadReport = async (report) => {
    try {
      console.log('📥 Downloading report:', report.title);

      if (report.download_url && report.download_url !== '#') {
        // Direct download via URL
        window.open(report.download_url, '_blank');
      } else {
        // Generate download via N8N
        const downloadPayload = {
          meetingId: meetingId,
          reportId: report.id,
          requestType: 'download_rapport',
          format: 'html'
        };

        const response = await fetch(RAPPORT_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(downloadPayload)
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          throw new Error('Download failed');
        }
      }

    } catch (error) {
      console.error('❌ Download failed:', error);
      setError('Kon rapport niet downloaden: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckIcon sx={{ fontSize: 16 }} />;
      case 'generating': return <TimeIcon sx={{ fontSize: 16 }} />;
      case 'failed': return <CloseIcon sx={{ fontSize: 16 }} />;
      default: return null;
    }
  };

  return (
    <Card variant="default" padding="md">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📋 Rapport Generatie
            {reports.length > 0 && (
              <Badge variant="info">{reports.length} rapport{reports.length !== 1 ? 'en' : ''}</Badge>
            )}
          </Typography>
          
          <Button 
            variant="neutral" 
            size="sm"
            onClick={loadExistingReports}
            loading={isLoading}
          >
            <RefreshIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Vernieuw
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Genereer automatisch een gestructureerd rapport via N8N workflow
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Success Display */}
      {success && (
        <Box sx={{ mb: 3 }}>
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        </Box>
      )}

      {/* Generation Status */}
      {isGenerating && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LoadingSpinner size="sm" />
            <Typography variant="body2" sx={{ color: '#856404' }}>
              N8N genereert rapport... Dit kan enkele minuten duren.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="primary" 
          size="sm"
          onClick={generateRapportViaWebhook}
          loading={isGenerating}
          disabled={isLoading}
        >
          {isGenerating ? 'Genereren...' : 'Nieuw Rapport Genereren'}
        </Button>
        
        {reports.length > 0 && (
          <Button 
            variant="neutral" 
            size="sm"
            onClick={() => viewReport(reports[0])}
            disabled={isGenerating}
          >
            <ViewIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Laatste Rapport Bekijken
          </Button>
        )}
      </Box>

      {/* Reports List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <LoadingSpinner size="md">Rapporten laden...</LoadingSpinner>
        </Box>
      ) : reports.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h1" sx={{ fontSize: '3rem', mb: 2 }}>
            📄
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Nog geen rapporten gegenereerd
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Klik op "Nieuw Rapport Genereren" om te beginnen
          </Typography>
        </Box>
      ) : (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            📊 Beschikbare Rapporten ({reports.length})
          </Typography>
          
          <List sx={{ p: 0 }}>
            {reports.map((report, index) => (
              <ListItem 
                key={report.id}
                sx={{ 
                  px: 0, 
                  py: 1,
                  borderRadius: 2,
                  mb: 1,
                  border: '1px solid #e2e8f0',
                  bgcolor: 'white',
                  '&:hover': { 
                    bgcolor: '#f8fafc',
                    borderColor: '#3b82f6'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {report.title}
                      </Typography>
                      <Badge variant={getStatusColor(report.status)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getStatusIcon(report.status)}
                          {report.status}
                        </Box>
                      </Badge>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Gegenereerd: {new Date(report.created_at).toLocaleString('nl-NL')}
                      </Typography>
                      {report.sections && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          • {report.sections.length} secties
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        • {report.type}
                      </Typography>
                    </Box>
                  }
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    onClick={() => viewReport(report)}
                    size="small"
                    sx={{ 
                      color: '#3b82f6',
                      '&:hover': { bgcolor: '#eff6ff' }
                    }}
                    title="Rapport bekijken"
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  
                  <IconButton 
                    onClick={() => downloadReport(report)}
                    size="small"
                    sx={{ 
                      color: '#059669',
                      '&:hover': { bgcolor: '#f0fdf4' }
                    }}
                    title="Rapport downloaden"
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}


      {/* Report Viewer Modal */}
      <Dialog 
        open={showReportModal} 
        onClose={() => setShowReportModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📋 {currentReport?.title}
            </Typography>
            <Badge variant={getStatusColor(currentReport?.status || 'default')}>
              {currentReport?.status}
            </Badge>
          </Box>
          
          <IconButton 
            onClick={() => setShowReportModal(false)}
            size="small"
            sx={{ 
              color: '#64748b',
              '&:hover': { bgcolor: '#e2e8f0' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {currentReport ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Report Metadata */}
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f1f5f9', 
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  📊 Rapport Informatie
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: '0.875rem' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Gegenereerd:</Typography>
                    <Typography variant="body2">{new Date(currentReport.created_at).toLocaleString('nl-NL')}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Type:</Typography>
                    <Typography variant="body2">{currentReport.type}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Secties:</Typography>
                    <Typography variant="body2">{currentReport.sections?.length || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status:</Typography>
                    <Typography variant="body2">{currentReport.status}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Report Sections */}
              {currentReport.sections && currentReport.sections.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    📄 Rapport Secties
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {currentReport.sections.map((section, index) => (
                      <Chip 
                        key={index}
                        label={section}
                        size="small"
                        variant="outlined"
                        sx={{ bgcolor: '#f8fafc' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Report Content Preview */}
              {currentReport.content && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    📝 Inhoud Preview
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#fafafa', 
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {currentReport.content}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Placeholder for missing content */}
              {!currentReport.content && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Rapport inhoud wordt geladen via N8N workflow...
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Geen rapport geselecteerd
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="neutral"
            onClick={() => setShowReportModal(false)}
          >
            Sluiten
          </Button>
          
          {currentReport && (
            <Button
              variant="primary"
              onClick={() => downloadReport(currentReport)}
            >
              <DownloadIcon sx={{ mr: 1 }} />
              Download Rapport
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RapportPanel;