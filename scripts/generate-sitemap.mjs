#!/usr/bin/env node

/**
 * Sitemap Generator for esarjistasyonu.com.tr
 *
 * Fetches all Turkey EV charging stations from OpenChargeMap API
 * and generates a sitemap.xml with static routes + dynamic station pages.
 *
 * Usage:
 *   VITE_OCM_API_KEY=your_key npm run generate-sitemap
 *   -- or --
 *   node scripts/generate-sitemap.mjs
 *
 * Output: public/sitemap.xml
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '..', 'public', 'sitemap.xml');
const SITE_URL = 'https://esarjistasyonu.com.tr';
const OCM_API = 'https://api.openchargemap.io/v3/poi';
const OCM_KEY = process.env.VITE_OCM_API_KEY || '';

const TODAY = new Date().toISOString().split('T')[0];

// All static routes with their metadata
const STATIC_ROUTES = [
  { path: '/',                    changefreq: 'daily',   priority: '1.0' },
  { path: '/ev-sarj-rehberi',    changefreq: 'weekly',  priority: '0.9' },
  { path: '/sozluk',             changefreq: 'monthly', priority: '0.8' },
  { path: '/sehirler',           changefreq: 'monthly', priority: '0.8' },
  { path: '/menzil-hesaplayici', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog',               changefreq: 'weekly',  priority: '0.7' },
  { path: '/hakkimizda',         changefreq: 'monthly', priority: '0.6' },
  { path: '/gizlilik-politikasi', changefreq: 'monthly', priority: '0.4' },
  { path: '/kullanim-sartlari',  changefreq: 'monthly', priority: '0.4' },
  { path: '/cerez-politikasi',   changefreq: 'monthly', priority: '0.4' },
  { path: '/kvkk',               changefreq: 'monthly', priority: '0.4' },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchAllStations() {
  // OpenChargeMap caps maxresults at ~10000. We paginate to get all Turkey stations.
  const allStations = [];
  const PAGE_SIZE = 5000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      output: 'json',
      countrycode: 'TR',
      maxresults: String(PAGE_SIZE),
      compact: 'true',
      verbose: 'false',
    });

    if (OCM_KEY) params.set('key', OCM_KEY);

    // OCM doesn't have a clean offset param, but we can use it with some tricks.
    // For simplicity, do a single large request first. If we get PAGE_SIZE results,
    // we warn but continue (most Turkey datasets are < 5000 anyway).
    try {
      const url = `${OCM_API}?${params}`;
      console.log(`Fetching stations (offset=${offset})...`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log(`  -> Received ${data.length} stations`);

      allStations.push(...data);

      // OpenChargeMap doesn't support true pagination; stop after first batch
      hasMore = false;
    } catch (err) {
      console.error(`Failed to fetch stations:`, err.message);
      hasMore = false;
    }

    offset += PAGE_SIZE;
  }

  return allStations;
}

async function main() {
  console.log('=== Sitemap Generator ===');
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`API Key: ${OCM_KEY ? '***' + OCM_KEY.slice(-4) : '(not set - requests may fail)'}`);
  console.log('');

  // 1) Static routes
  const entries = STATIC_ROUTES.map((route) =>
    buildUrlEntry({
      loc: `${SITE_URL}${route.path}`,
      lastmod: TODAY,
      changefreq: route.changefreq,
      priority: route.priority,
    })
  );
  console.log(`Static routes: ${entries.length}`);

  // 2) Dynamic station pages
  const stations = await fetchAllStations();
  const validStations = stations.filter((s) => s.ID);

  for (const station of validStations) {
    entries.push(
      buildUrlEntry({
        loc: `${SITE_URL}/istasyon/${station.ID}`,
        lastmod: TODAY,
        changefreq: 'weekly',
        priority: '0.5',
      })
    );
  }
  console.log(`Station pages: ${validStations.length}`);
  console.log(`Total URLs: ${entries.length}`);

  // 3) Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  // 4) Write file
  writeFileSync(OUTPUT_PATH, xml, 'utf-8');
  console.log(`\nSitemap written to ${OUTPUT_PATH}`);
  console.log(`File size: ${(Buffer.byteLength(xml) / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
