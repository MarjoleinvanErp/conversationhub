// frontend/src/test-utils/setupTests.ts

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
    enumerateDevices: jest.fn().mockResolvedValue([]),
  },
});

// Mock MediaRecorder
global.MediaRecorder = class MediaRecorder {
  static isTypeSupported = jest.fn().mockReturnValue(true);
  
  constructor() {
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onerror = null;
    this.onstart = null;
    this.onstop = null;
    this.onpause = null;
    this.onresume = null;
  }
  
  start = jest.fn(() => {
    this.state = 'recording';
    if (this.onstart) this.onstart();
  });
  
  stop = jest.fn(() => {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  });
  
  pause = jest.fn(() => {
    this.state = 'paused';
    if (this.onpause) this.onpause();
  });
  
  resume = jest.fn(() => {
    this.state = 'recording';
    if (this.onresume) this.onresume();
  });
};

// Mock SpeechRecognition
global.SpeechRecognition = class SpeechRecognition {
  constructor() {
    this.continuous = true;
    this.interimResults = true;
    this.lang = 'nl-NL';
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onstart = null;
  }
  
  start = jest.fn(() => {
    if (this.onstart) this.onstart();
  });
  
  stop = jest.fn();
  abort = jest.fn();
};

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onloadstart = null;
    this.onloadend = null;
    this.onprogress = null;
    this.onabort = null;
  }
  
  readAsDataURL = jest.fn((file) => {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:audio/webm;base64,dGVzdGF1ZGlvZGF0YQ==';
      if (this.onload) this.onload();
    }, 0);
  });
  
  readAsText = jest.fn();
  readAsArrayBuffer = jest.fn();
  abort = jest.fn();
};

// Mock Blob
global.Blob = class Blob {
  constructor(array, options) {
    this.size = array.reduce((acc, item) => acc + item.length, 0);
    this.type = options?.type || '';
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Increase timeout for async tests
jest.setTimeout(10000);

// Suppress console errors/warnings in tests unless explicitly testing them
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});