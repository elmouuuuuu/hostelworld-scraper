import { NextRequest, NextResponse } from 'next/server';
import { generateReportRequestSchema } from '@/validation/schemas';
import { scrapeCities } from '@/lib/scraper/scrapeCities';
import { buildCityReport } from '@/lib/statistics/buildCityReport';
import { buildWorkbook, generateReportFileName } from '@/lib/excel/workbookBuilder';
import { getAutoSearchDates } from '@/lib/utils/dateUtils';
import { createLogger } from '@/lib/utils/logger';
import config from '@/config/config';
import type { GenerateReportStreamMessage, GenerateReportSummary } from '@/types/api';
import type { CityReport, ReportMetadata, ReportResult } from '@/types/report';

export const runtime = 'nodejs';
export const maxDuration = 300;

const logger = createLogger('api:generate-report');

/**
 * POST /api/generate-report
 *
 * The real pipeline: validate -> scrape -> compute statistics -> build
 * the Excel workbook. Streams progress as newline-delimited JSON, ending
 * with the finished file or an error message.
 *
 * Cancellation: `request.signal` (the standard Fetch API AbortSignal
 * tied to the underlying connection) is passed straight into
 * scrapeCities. If the client aborts its fetch (Cancel button), this
 * signal fires, and the scraper stops at its next checkpoint — before
 * the next city, page, or hostel — rather than continuing to burn
 * through remaining work in the background after nobody is listening.
 * If the run was cancelled, no workbook is built and nothing further is
 * sent — there's no point doing that work for a response nobody wants.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = generateReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: JSON.stringify(parsed.error.flatten()) },
      { status: 400 }
    );
  }

  const {
    cities,
    minimumRating,
    rawDataMode,
    currency,
    detailedMode,
    checkIn: manualCheckIn,
    checkOut: manualCheckOut,
  } = parsed.data;

  const { checkIn, checkOut } =
    manualCheckIn && manualCheckOut
      ? { checkIn: new Date(manualCheckIn), checkOut: new Date(manualCheckOut) }
      : getAutoSearchDates();

  const startTime = Date.now();

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(message: GenerateReportStreamMessage): void {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(message) + '\n'));
        } catch {
          // Client already disconnected — nothing more to do.
        }
      }

      try {
        const result = await scrapeCities(cities, checkIn, checkOut, minimumRating, currency, detailedMode, {
          onProgress: (event) => send({ type: 'progress', event }),
          signal: request.signal,
        });

        if (result.cancelled) {
          logger.info('Report generation cancelled by client — skipping workbook build.');
          return;
        }

        const cityReports: CityReport[] = result.cityResults.map((cityResult) =>
          buildCityReport(cityResult.city.name, cityResult.city.country, cityResult.hostels)
        );

        const metadata: ReportMetadata = {
          generatedAt: new Date(),
          currency,
          searchCheckIn: checkIn,
          searchCheckOut: checkOut,
          minimumRating,
          rawDataModeEnabled: rawDataMode,
          citiesRequested: cities.length,
          qualifyingHostelsTotal: cityReports.reduce((sum, report) => sum + report.qualifyingHostels.length, 0),
          failedCitiesCount: result.failedCities.length,
          scraperVersion: config.app.scraperVersion,
          totalExecutionTimeMs: Date.now() - startTime,
        };

        const reportResult: ReportResult = {
          metadata,
          cityReports,
          failedCities: result.failedCities,
        };

        const buffer = await buildWorkbook(reportResult);
        const fileName = generateReportFileName(metadata.generatedAt);
        const fileBase64 = Buffer.from(buffer).toString('base64');

        const summary: GenerateReportSummary = {
          cities: cityReports.map((report) => ({
            city: report.city,
            country: report.country,
            qualifyingHostels: report.qualifyingHostels.length,
          })),
          totalQualifyingHostels: metadata.qualifyingHostelsTotal,
          failedCities: result.failedCities.map((failed) => ({
            city: failed.city,
            country: failed.country,
            reasonCode: failed.reasonCode,
            reason: failed.reason,
          })),
        };

        send({ type: 'complete', fileName, fileBase64, summary });
        logger.info(`Report complete: ${cityReports.length} cities succeeded, ${result.failedCities.length} failed.`);
      } catch (error) {
        logger.error('Report generation failed', error);
        send({ type: 'error', message: error instanceof Error ? error.message : String(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
