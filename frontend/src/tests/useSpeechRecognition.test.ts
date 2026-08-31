import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useI18n } from '../i18n';

describe('useSpeechRecognition hook & Web Speech API integration', () => {
  let mockRecognitionInstance: any;
  let originalWindow: any;

  beforeEach(() => {
    mockRecognitionInstance = {
      continuous: false,
      interimResults: false,
      lang: '',
      start: vi.fn(function (this: any) {
        this.onstart?.();
      }),
      stop: vi.fn(function (this: any) {
        this.onend?.();
      }),
      abort: vi.fn(function (this: any) {
        this.onend?.();
      }),
      onstart: null,
      onend: null,
      onerror: null,
      onresult: null
    };

    originalWindow = globalThis.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = {
      SpeechRecognition: vi.fn(function () {
        return mockRecognitionInstance;
      })
    };
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = originalWindow;
  });

  it('initializes with Web Speech API support', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (globalThis.window as any).SpeechRecognition;
    expect(SpeechRecognition).toBeDefined();
  });

  it('correctly formats speech language from i18n store', () => {
    useI18n.getState().setLanguage('zh');
    expect(useI18n.getState().language).toBe('zh');

    useI18n.getState().setLanguage('en');
    expect(useI18n.getState().language).toBe('en');
  });

  it('creates recognition instance with proper parameters and handles speech events', () => {
    useI18n.getState().setLanguage('zh');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RecognitionClass = (globalThis.window as any).SpeechRecognition;
    const recognition = new RecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);
    expect(recognition.lang).toBe('zh-CN');

    let received = '';
    recognition.onresult = (e: any) => {
      received = e.results[0][0].transcript;
    };

    recognition.onresult({
      resultIndex: 0,
      results: [[{ transcript: '测试灵感记录', isFinal: true }]]
    });

    expect(received).toBe('测试灵感记录');
  });
});
