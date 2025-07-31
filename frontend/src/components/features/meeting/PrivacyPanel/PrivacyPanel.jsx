import React, { useState } from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { Card, Badge, Alert } from '../../../ui';

const PrivacyPanel = () => {
  const [privacyEnabled, setPrivacyEnabled] = useState(true);
  const [dataFiltering, setDataFiltering] = useState(true);

  return (
    <Card variant="default" padding="md">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🔒 Privacy & Beveiliging
          <Badge variant="success">GDPR Compliant</Badge>
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch 
              checked={privacyEnabled}
              onChange={(e) => setPrivacyEnabled(e.target.checked)}
              color="primary"
            />
          }
          label="Privacy filtering actief"
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch 
              checked={dataFiltering}
              onChange={(e) => setDataFiltering(e.target.checked)}
              color="primary"
            />
          }
          label="Automatische data filtering"
        />
      </Box>

      {privacyEnabled && (
        <Alert variant="success">
          Alle audio en transcripties worden gefilterd op gevoelige informatie
        </Alert>
      )}
    </Card>
  );
};

export default PrivacyPanel;