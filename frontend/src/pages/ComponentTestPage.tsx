// ConversationHub - Component Test Page
// Test pagina voor alle UI componenten

import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  LoadingSpinner, 
  Alert 
} from '@/components/ui';

const ComponentTestPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  
  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };
  
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            ConversationHub UI Components
          </h1>
          <p className="text-lg text-slate-600">
            Test pagina voor alle UI componenten van het Nederlandse overheid design system
          </p>
        </div>
        
        {/* Alert Section */}
        {showAlert && (
          <Alert
            variant="info"
            title="Component Test Pagina"
            dismissible
            onDismiss={() => setShowAlert(false)}
          >
            Deze pagina toont alle beschikbare UI componenten. Gebruik dit om de styling en functionaliteit te testen.
          </Alert>
        )}
        
        {/* Buttons Section */}
        <Card>
          <h2 className="text-2xl font-semibold mb-6">Buttons</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="neutral">Neutral Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button loading={loading} onClick={handleLoadingTest}>
                {loading ? 'Loading...' : 'Test Loading'}
              </Button>
              <Button disabled>Disabled Button</Button>
              <Button fullWidth>Full Width Button</Button>
            </div>
          </div>
        </Card>
        
        {/* Input Section */}
        <Card>
          <h2 className="text-2xl font-semibold mb-6">Input Fields</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Naam"
                placeholder="Voer uw naam in"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="Dit is een hulptekst"
              />
              
              <Input
                label="E-mail"
                type="email"
                placeholder="voorbeeld@overheid.nl"
                required
              />
              
              <Input
                label="Wachtwoord"
                type="password"
                placeholder="••••••••"
                error="Wachtwoord is te kort"
              />
              
              <Input
                label="Telefoon"
                placeholder="+31 6 12345678"
                disabled
                helperText="Dit veld is uitgeschakeld"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input size="sm" placeholder="Small input" />
              <Input size="md" placeholder="Medium input" />
              <Input size="lg" placeholder="Large input" />
            </div>
          </div>
        </Card>
        
        {/* Badges Section */}
        <Card>
          <h2 className="text-2xl font-semibold mb-6">Badges</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </div>
        </Card>
        
        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default">
            <h3 className="text-lg font-semibold mb-2">Default Card</h3>
            <p className="text-slate-600">
              Dit is een standaard card met border en subtiele shadow.
            </p>
          </Card>
          
          <Card variant="elevated">
            <h3 className="text-lg font-semibold mb-2">Elevated Card</h3>
            <p className="text-slate-600">
              Deze card heeft een verhoogde shadow met hover effect.
            </p>
          </Card>
          
          <Card variant="outlined">
            <h3 className="text-lg font-semibold mb-2">Outlined Card</h3>
            <p className="text-slate-600">
              Een card met dikke border en geen shadow.
            </p>
          </Card>
        </div>
        
        {/* Loading Section */}
        <Card>
          <h2 className="text-2xl font-semibold mb-6">Loading Spinners</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-8">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
            </div>
            
            <div className="flex items-center gap-8">
              <LoadingSpinner color="primary">Primary Loading</LoadingSpinner>
              <LoadingSpinner color="secondary">Secondary Loading</LoadingSpinner>
              <LoadingSpinner color="neutral">Neutral Loading</LoadingSpinner>
            </div>
          </div>
        </Card>
        
        {/* Alert Variants */}
        <div className="space-y-4">
          <Alert variant="info" title="Informatie">
            Dit is een informatieve melding voor gebruikers.
          </Alert>
          
          <Alert variant="success" title="Succesvol">
            De actie is succesvol uitgevoerd.
          </Alert>
          
          <Alert variant="warning" title="Waarschuwing">
            Let op: dit kan gevolgen hebben voor uw data.
          </Alert>
          
          <Alert variant="error" title="Fout">
            Er is een fout opgetreden. Probeer het opnieuw.
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default ComponentTestPage;