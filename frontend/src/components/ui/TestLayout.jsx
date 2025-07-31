// ConversationHub - Layout Test Component
import React from 'react';
import { MainLayout } from '../layout';
import { Button, Card, Badge } from './index';

const TestLayout = () => {
  return (
    <MainLayout title="ConversationHub Layout Test">
      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Layout Test Pagina
          </h1>
          <p className="text-gray-600 mb-4">
            Deze pagina test de nieuwe layout components:
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="success">✅ Header werkt</Badge>
            <Badge variant="success">✅ Sidebar werkt</Badge>
            <Badge variant="success">✅ Main content werkt</Badge>
            <Badge variant="info">📱 Responsive design</Badge>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold mb-3">Navigation Test</h2>
            <p className="text-gray-600 mb-4">
              Gebruik de sidebar links om tussen pagina's te navigeren.
            </p>
            <Button variant="primary">Test Navigation</Button>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-3">Layout Features</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Responsive header met user menu</li>
              <li>• Collapsible sidebar navigation</li>
              <li>• Consistent spacing en styling</li>
              <li>• Nederlandse overheid design</li>
            </ul>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-semibold mb-3">Volgende Stappen</h2>
          <p className="text-gray-600 mb-4">
            Nu we layout en UI components hebben, kunnen we:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">Bestaande pagina's migreren</Button>
            <Button variant="neutral">Meer components toevoegen</Button>
            <Button variant="primary">Production ready maken</Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TestLayout;