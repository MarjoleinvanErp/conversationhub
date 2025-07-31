// ConversationHub - Test Existing Components
import React, { useState } from 'react';

// Test de barrel export
import { Button, Input, Card, Badge, LoadingSpinner, Alert } from './index';

const TestExistingComponents = () => {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  
  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ConversationHub - Bestaande UI Componenten Test
          </h1>
          <p className="text-gray-600">
            Test van alle UI componenten via barrel export
          </p>
        </div>
        
        {/* Alert Test */}
        {showAlert && (
          <Alert
            variant="info"
            title="Component Test"
            dismissible
            onDismiss={() => setShowAlert(false)}
          >
            Test van alle bestaande UI componenten
          </Alert>
        )}
        
        {/* Button Tests */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="neutral">Neutral</Button>
              <Button variant="danger">Danger</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            
            <Button 
              loading={loading} 
              onClick={handleLoadingTest}
            >
              {loading ? 'Loading...' : 'Test Loading'}
            </Button>
          </div>
        </Card>
        
        {/* Input Tests */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Inputs</h2>
          <Input
            label="Test Input"
            placeholder="Type hier..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Test van input component"
          />
        </Card>
        
        {/* Badge Tests */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </Card>
        
        {/* Loading Spinner */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Loading Spinner</h2>
          <div className="flex items-center gap-4">
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="md" />
            <LoadingSpinner size="lg" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestExistingComponents;