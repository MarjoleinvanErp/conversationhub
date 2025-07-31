// ConversationHub - Material-UI Integration Test
import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  Box,
  Divider
} from '@mui/material';
import { Button, Input, Card, Badge, Alert } from './index';

const TestMaterialProIntegration = () => {
  const [inputValue, setInputValue] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ConversationHub UI Integration Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test van onze custom UI components binnen de MaterialPro layout
        </Typography>
      </Box>

      {/* Alert Test */}
      {showAlert && (
        <Box sx={{ mb: 3 }}>
          <Alert
            variant="info"
            title="Integration Test"
            dismissible
            onDismiss={() => setShowAlert(false)}
          >
            Onze custom components werken perfect samen met Material-UI!
          </Alert>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Custom Button Tests */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom Buttons
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="neutral">Neutral</Button>
              <Button variant="danger">Danger</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Box>
            <Button 
              loading={loading} 
              onClick={handleLoadingTest}
              fullWidth
            >
              {loading ? 'Loading...' : 'Test Loading State'}
            </Button>
          </Paper>
        </Grid>

        {/* Custom Input Tests */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom Inputs
            </Typography>
            <Box sx={{ space: 2 }}>
              <Input
                label="Naam"
                placeholder="Voer uw naam in"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="Test van custom input component"
                fullWidth
              />
              <Box sx={{ mt: 2 }}>
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="voorbeeld@overheid.nl"
                  fullWidth
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Custom Card and Badge Tests */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom Cards & Badges
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="default" padding="md">
                  <Typography variant="h6" gutterBottom>Default Card</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dit is onze custom card component
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Badge variant="success">Succes</Badge>
                    <Badge variant="info">Info</Badge>
                  </Box>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="elevated" padding="md">
                  <Typography variant="h6" gutterBottom>Elevated Card</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Met hover effects en shadows
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Badge variant="warning">Waarschuwing</Badge>
                    <Badge variant="error">Error</Badge>
                  </Box>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" padding="md">
                  <Typography variant="h6" gutterBottom>Outlined Card</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Minimale styling met border
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Badge variant="default">Standaard</Badge>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Status Check */}
        <Grid item xs={12}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9'
            }}
          >
            <Typography variant="h6" gutterBottom color="primary">
              ✅ Integration Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Badge variant="success">MaterialPro Layout</Badge>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Professionele basis
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Badge variant="success">Custom UI Components</Badge>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Type-safe & modern
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Badge variant="success">Material-UI Theming</Badge>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Consistent styling
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Badge variant="info">Nederlandse Overheid</Badge>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Design compliance
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TestMaterialProIntegration;