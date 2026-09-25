/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // playwright-core, @sparticuz/chromium, and exceljs are Node-only
  // libraries used exclusively inside API routes (server side). They
  // must never be bundled into client code. @sparticuz/chromium
  // specifically requires this — it resolves its binary via relative
  // paths that break if bundled (per its own documentation).
  //
  // externalizing alone (serverComponentsExternalPackages) was NOT
  // sufficient on its own — confirmed via a real failed Vercel deploy
  // (Aug 2026): "The input directory .../node_modules/@sparticuz/
  // chromium/bin does not exist". That's a separate problem from JS
  // bundling: Next.js's automatic file-tracing (@vercel/nft) can't
  // statically detect @sparticuz/chromium's binary asset files, since
  // it locates them via a runtime-computed path rather than a plain
  // require(). outputFileTracingIncludes force-includes them.
  //
  // outputFileTracingIncludes stays nested under `experimental` here
  // specifically because this project is on Next.js 14.2.35 — it only
  // became a stable, top-level option starting in Next.js 15.
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium', 'exceljs'],
    outputFileTracingIncludes: {
      '/*': ['node_modules/@sparticuz/chromium/**/*'],
    },
  },
};

module.exports = nextConfig;
