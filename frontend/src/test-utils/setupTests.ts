/**
 * Complete setupTests.ts replacement
 * File: src/test-utils/setupTests.ts
 * This fixes all the mock-related TypeScript errors
 */

import '@testing-library/jest-dom';

// IntersectionObserver Mock with proper types
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    private options?: IntersectionObserverInit
  ) {}

  observe(target: Element): void {
    // Mock implementation
  }

  unobserve(target: Element): void {
    // Mock implementation
  }

  disconnect(): void {
    // Mock implementation
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver;

// ResizeObserver Mock
global.ResizeObserver = class MockResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  
  observe(target: Element): void {
    // Mock implementation
  }
  
  unobserve(target: Element): void {
    // Mock implementation
  }
  
  disconnect(): void {
    // Mock implementation
  }
};

// Navigator MediaDevices Mock
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
      getAudioTracks: () => [{ stop: jest.fn() }]
    }),
    enumerateDevices: jest.fn().mockResolvedValue([])
  }
});

// MediaRecorder Mock with all required properties
class MockMediaRecorder implements Partial<MediaRecorder> {
  state: RecordingState = 'inactive';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstart: ((event: Event) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  onpause: ((event: Event) => void) | null = null;
  onresume: ((event: Event) => void) | null = null;
  
  // Add required MediaRecorder properties
  audioBitsPerSecond: number = 0;
  mimeType: string = 'audio/webm';
  videoBitsPerSecond: number = 0;
  stream: MediaStream = new MediaStream();

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    this.stream = stream;
  }

  start = jest.fn((timeslice?: number) => {
    this.state = 'recording';
    if (this.onstart) {
      this.onstart(new Event('start'));
    }
  });

  stop = jest.fn(() => {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop(new Event('stop'));
    }
  });

  pause = jest.fn(() => {
    this.state = 'paused';
    if (this.onpause) {
      this.onpause(new Event('pause'));
    }
  });

  resume = jest.fn(() => {
    this.state = 'recording';
    if (this.onresume) {
      this.onresume(new Event('resume'));
    }
  });

  requestData = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();

  static isTypeSupported = jest.fn().mockReturnValue(true);
}

// Properly assign MediaRecorder with correct typing
(global as any).MediaRecorder = MockMediaRecorder as any;

// SpeechRecognition Mock
interface MockSpeechRecognitionType {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: ((event: any) => void) | null;
  onstart: ((event: any) => void) | null;
  start: jest.Mock;
  stop: jest.Mock;
  abort: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  dispatchEvent: jest.Mock;
}

class MockSpeechRecognition implements MockSpeechRecognitionType {
  continuous: boolean = true;
  interimResults: boolean = true;
  lang: string = 'nl-NL';
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: ((event: any) => void) | null = null;
  onstart: ((event: any) => void) | null = null;

  start = jest.fn(() => {
    if (this.onstart) {
      this.onstart(new Event('start'));
    }
  });

  stop = jest.fn(() => {
    if (this.onend) {
      this.onend(new Event('end'));
    }
  });

  abort = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

(global as any).SpeechRecognition = MockSpeechRecognition;
(global as any).webkitSpeechRecognition = MockSpeechRecognition;

// FileReader Mock
class MockFileReader implements Partial<FileReader> {
  readyState: 0 | 1 | 2 = 0;
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onloadstart: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onloadend: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onprogress: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onabort: ((event: ProgressEvent<FileReader>) => void) | null = null;

  // Add constants
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  readAsDataURL = jest.fn((blob: Blob) => {
    setTimeout(() => {
      this.readyState = MockFileReader.DONE;
      this.result = 'data:audio/webm;base64,dGVzdGF1ZGlvZGF0YQ==';
      if (this.onload) {
        const event = new ProgressEvent('load') as ProgressEvent<FileReader>;
        this.onload(event);
      }
    }, 0);
  });

  readAsText = jest.fn();
  readAsArrayBuffer = jest.fn();
  readAsBinaryString = jest.fn();
  abort = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

// Set constants on the constructor
(MockFileReader as any).EMPTY = 0;
(MockFileReader as any).LOADING = 1;
(MockFileReader as any).DONE = 2;

(global as any).FileReader = MockFileReader;

// Blob Mock
class MockBlob implements Blob {
  size: number;
  type: string;

  constructor(blobParts: BlobPart[] = [], options: BlobPropertyBag = {}) {
    this.size = blobParts.reduce((acc: number, item: any) => {
      if (typeof item === 'string') return acc + item.length;
      if (item instanceof ArrayBuffer) return acc + item.byteLength;
      if (item.length !== undefined) return acc + item.length;
      return acc;
    }, 0);
    this.type = options.type || '';
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new MockBlob([], { type: contentType || this.type });
  }

  stream(): ReadableStream<Uint8Array> {
    return new ReadableStream();
  }

  text(): Promise<string> {
    return Promise.resolve('mock text');
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  bytes(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(this.size));
  }
}

(global as any).Blob = MockBlob;

// Add missing global types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  
  var SpeechRecognition: any;
  var webkitSpeechRecognition: any;
}

// Export for use in tests
export {
  MockMediaRecorder,
  MockSpeechRecognition,
  MockFileReader,
  MockBlob,
  MockIntersectionObserver
};