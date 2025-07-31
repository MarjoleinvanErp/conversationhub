// ConversationHub - Simple UI Components Test
import React, { useState } from 'react';

// Simpele test componenten
const TestButton = ({ children, onClick, variant = 'primary' }) => {
  const baseStyle = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantStyle = variant === 'primary' 
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  
  return (
    <button 
      className={`${baseStyle} ${variantStyle}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TestCard = ({ children, title }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

const TestInput = ({ label, placeholder, value, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      type="text"
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

const TestComponents = () => {
  const [inputValue, setInputValue] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ConversationHub UI Test
          </h1>
          <p className="text-gray-600">
            Test van UI componenten - dit werkt als je dit ziet!
          </p>
        </div>
        
        {/* Alert */}
        {showAlert && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-blue-800 font-medium">UI Test Succesvol!</h3>
                <p className="text-blue-700 text-sm">
                  Als je dit ziet, werken React, JSX en Tailwind CSS correct.
                </p>
              </div>
              <button 
                onClick={() => setShowAlert(false)}
                className="text-blue-400 hover:text-blue-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Buttons Test */}
        <TestCard title="Buttons Test">
          <div className="space-x-4 space-y-2">
            <TestButton onClick={() => alert('Primary button werkt!')}>
              Primary Button
            </TestButton>
            <TestButton 
              variant="secondary" 
              onClick={() => alert('Secondary button werkt!')}
            >
              Secondary Button
            </TestButton>
          </div>
        </TestCard>
        
        {/* Input Test */}
        <TestCard title="Input Test">
          <TestInput
            label="Test Input"
            placeholder="Type hier om te testen..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {inputValue && (
            <p className="text-sm text-gray-600">
              Je typte: <strong>{inputValue}</strong>
            </p>
          )}
        </TestCard>
        
        {/* Status Test */}
        <TestCard title="Status Badges">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              ✅ React werkt
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              ✅ JSX werkt
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              ✅ Tailwind werkt
            </span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              ✅ Vite werkt
            </span>
          </div>
        </TestCard>
      </div>
    </div>
  );
};

export default TestComponents;