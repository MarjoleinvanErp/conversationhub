import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Avatar,
  InputAdornment,
  Link as MuiLink,
  Alert,
  Divider
} from '@mui/material';
import {
  Lock as LockIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Chat as ChatIcon,
  RecordVoiceOver as VoiceIcon
} from '@mui/icons-material';
import { Button, LoadingSpinner } from '../../components/ui';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login mislukt');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Er is een fout opgetreden bij het inloggen');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <VoiceIcon sx={{ color: '#10b981' }} />,
      title: 'Real-time Transcriptie',
      description: 'Live audio-naar-tekst conversie tijdens gesprekken'
    },
    {
      icon: <SecurityIcon sx={{ color: '#3b82f6' }} />,
      title: 'AVG/GDPR Compliant',
      description: 'Privacy-first design voor Nederlandse overheid'
    },
    {
      icon: <ChatIcon sx={{ color: '#f59e0b' }} />,
      title: 'Slimme Filtering',
      description: 'Automatische filtering van gevoelige informatie'
    },
    {
      icon: <BusinessIcon sx={{ color: '#8b5cf6' }} />,
      title: 'Multi-tenant Support',
      description: 'Geschikt voor verschillende organisaties'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          
          {/* Linker Kolom - Branding en Features */}
          <Grid item xs={12} lg={6} sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Box sx={{ color: 'white', pr: 4 }}>
              
              {/* Logo en Branding */}
              <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      mr: 3,
                      fontSize: '2rem'
                    }}
                  >
                    💬
                  </Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      ConversationHub
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                      Intelligente Gespreksondersteuning
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ fontSize: '1.125rem', lineHeight: 1.6, opacity: 0.9 }}>
                  Transformeer uw gesprekken met AI-gedreven transcriptie, 
                  privacy-beschermde filtering en real-time ondersteuning. 
                  Speciaal ontwikkeld voor de Nederlandse publieke sector.
                </Typography>
              </Box>

              {/* Features Grid */}
              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 3,
                        color: 'white',
                        height: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(5px)'
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem', lineHeight: 1.4 }}>
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

            </Box>
          </Grid>

          {/* Rechter Kolom - Login Form */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                elevation={20}
                sx={{
                  width: '100%',
                  maxWidth: 480,
                  borderRadius: 4,
                  overflow: 'hidden',
                  backdropFilter: 'blur(20px)',
                  bgcolor: 'rgba(255, 255, 255, 0.95)'
                }}
              >
                <CardContent sx={{ p: 5 }}>
                  
                  {/* Mobile Logo */}
                  <Box sx={{ display: { xs: 'block', lg: 'none' }, textAlign: 'center', mb: 4 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: '#10b981',
                        mx: 'auto',
                        mb: 2,
                        fontSize: '1.75rem'
                      }}
                    >
                      💬
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                      ConversationHub
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Welkom terug
                    </Typography>
                  </Box>

                  {/* Desktop Header */}
                  <Box sx={{ display: { xs: 'none', lg: 'block' }, mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                      Welkom Terug
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Log in om toegang te krijgen tot uw dashboard
                    </Typography>
                  </Box>

                  {/* Error Message */}
                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ mb: 3, borderRadius: 2 }}
                      onClose={() => setError('')}
                    >
                      {error}
                    </Alert>
                  )}

                  {/* Login Form */}
                  <Box component="form" onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
                        E-mailadres
                      </Typography>
                      <TextField
                        fullWidth
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="je.naam@organisatie.nl"
                        required
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: '#9ca3af' }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2 }
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
                        Wachtwoord
                      </Typography>
                      <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Voer uw wachtwoord in"
                        required
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: '#9ca3af' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                sx={{ minWidth: 'auto', p: 1 }}
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </Button>
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2 }
                        }}
                      />
                    </Box>

                    {/* Remember Me en Forgot Password */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={loading}
                            sx={{ color: '#10b981' }}
                          />
                        }
                        label={
                          <Typography variant="body2" color="text.secondary">
                            Onthoud mij
                          </Typography>
                        }
                      />
                      <MuiLink
                        href="#"
                        variant="body2"
                        sx={{
                          color: '#10b981',
                          textDecoration: 'none',
                          fontWeight: 500,
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Wachtwoord vergeten?
                      </MuiLink>
                    </Box>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      size="lg"
                      loading={loading}
                      disabled={loading}
                      startIcon={!loading ? <LockIcon /> : undefined}
                      sx={{ mb: 3, py: 1.5 }}
                    >
                      {loading ? 'Inloggen...' : 'Inloggen'}
                    </Button>

                    {/* Divider */}
                    <Divider sx={{ mb: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                        Test Account
                      </Typography>
                    </Divider>

                    {/* Test Account Info */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        mb: 3
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 1, display: 'block' }}>
                        🧪 Ontwikkelings Account
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Email:</strong> test@conversationhub.nl
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Wachtwoord:</strong> password123
                        </Typography>
                      </Box>
                    </Paper>

                    {/* Future SSO Info */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Microsoft Single Sign-On komt binnenkort beschikbaar
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        🔒 Veilig • 🇳🇱 AVG Compliant • 🏢 Enterprise Ready
                      </Typography>
                    </Box>

                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default Login;