import React from 'react';
import { Box, Typography } from '@mui/material';
import { Card, Button } from '../../../ui';

const RapportPanel = () => {
  return (
    <Card variant="default" padding="md">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📋 Rapport Generatie
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Automatische rapportage van het gesprek
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="primary" size="sm">
          Genereer Rapport
        </Button>
        <Button variant="neutral" size="sm">
          Download PDF
        </Button>
      </Box>
    </Card>
  );
};

export default RapportPanel;