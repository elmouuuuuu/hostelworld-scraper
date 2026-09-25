'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SelectedCity } from '@/types/city';
import type { ProgressEvent, GenerateReportStreamMessage, GenerateReportSummary } from '@/types/api';

export type GenerationStatus = 'idle' | 'running' | 'success' | 'error';

export interface StartReportOptions {
  cities: SelectedCity[];
  minimumRating: number;
  rawDataMode: boolean;
  /** ISO 4217 currency code, e.g. 'USD', 'EUR' — see lib/utils/currencies.ts. */
  currency: string;
  /** Exact per-hostel pricing (slower, capped to far fewer cities server-side). */
  detailedMode: boolean;
  /** ISO date strings (YYYY-MM-DD). Omit both to use auto-computed dates. */
  checkIn?: string;
  checkOut?: string;
}

interface UseReportGenerationResult {
  status: GenerationStatus;
  events: ProgressEvent[];
  latestEvent: ProgressEvent | null;
  errorMessage: string | null;
  summary: GenerateReportSummary | null;
  downloadedFileName: string | null;
  start: (options: StartReportOptions) => void;
  downloadAgain: () => void;
  reset: () => void;
}

/** Decodes a base64 string into a Blob and triggers a normal browser download. */
function triggerBrowserDownload(base64: string, fileName: string): void {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Orchestrates the full "Generate Report" flow against the real
 * backend: idle -> running -> success|error, streaming live progress
 * from POST /api/generate-report (newline-delimited JSON) and
 * triggering the download once the finished workbook arrives.
 */
export function useReportGeneration(): UseReportGenerationResult {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<GenerateReportSummary | null>(null);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const lastFileRef = useRef<{ base64: string; fileName: string } | null>(null);

  const start = useCallback((options: StartReportOptions) => {
    abortRef.current?.abort();

    if (options.cities.length === 0) {
      setStatus('error');
      setErrorMessage('Add at least one city before generating a report.');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('running');
    setEvents([]);
    setErrorMessage(null);
    setSummary(null);
    setDownloadedFileName(null);
    lastFileRef.current = null;

    (async () => {
      try {
        const response = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cities: options.cities,
            minimumRating: options.minimumRating,
            rawDataMode: options.rawDataMode,
            currency: options.currency,
            detailedMode: options.detailedMode,
            ...(options.checkIn && options.checkOut
              ? { checkIn: options.checkIn, checkOut: options.checkOut }
              : {}),
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(
            (errorBody && typeof errorBody.error === 'string' && errorBody.error) ||
              `Report generation failed (HTTP ${response.status}).`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Read the stream as it arrives — each complete line is one
        // GenerateReportStreamMessage. The last, possibly-incomplete
        // line in a chunk is held over and prepended to the next chunk.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const message = JSON.parse(line) as GenerateReportStreamMessage;

            if (message.type === 'progress') {
              setEvents((prev) => [...prev, message.event]);
            } else if (message.type === 'complete') {
              lastFileRef.current = { base64: message.fileBase64, fileName: message.fileName };
              setSummary(message.summary);
              triggerBrowserDownload(message.fileBase64, message.fileName);
              setDownloadedFileName(message.fileName);
              setStatus('success');
            } else if (message.type === 'error') {
              setErrorMessage(message.message);
              setStatus('error');
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Failed to generate report.');
        setStatus('error');
      }
    })();
  }, []);

  const downloadAgain = useCallback(() => {
    if (lastFileRef.current) {
      triggerBrowserDownload(lastFileRef.current.base64, lastFileRef.current.fileName);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
    setEvents([]);
    setErrorMessage(null);
    setSummary(null);
    setDownloadedFileName(null);
    lastFileRef.current = null;
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  return {
    status,
    events,
    latestEvent,
    errorMessage,
    summary,
    downloadedFileName,
    start,
    downloadAgain,
    reset,
  };
}
