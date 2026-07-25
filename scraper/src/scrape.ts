import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { firefox } from "playwright";
import * as cheerio from "cheerio";
import type { SpecialItem, SpecialsData } from "./types.js";

const SPECIALS_URL = "https://www.woolworths.co.nz/shop/specials";
const OUTPUT_PATH = fileURLToPath(new URL("../../data/specials.json", import.meta.url));
const MAX_PAGES = 15;
const PAGE_LOAD_DELAY_MS = 7000;

const TYPE_EXCLUSIONS = ["media", "font"];
const URL_EXCLUSIONS = [
  "googleoptimize.com",
  "gtm.js",
  "visitoridentification.js",
  "js-agent.newrelic.com",
  "cquotient.com",
  "googletagmanager.com",
  "cloudflareinsights.com",
  "facebook.net",
  "algolia.io",
  "algoliaradar.com",
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMoney(text: string | undefined): number | null {
  if (!text) return null;
  const match = text.replace(",", "").match(/(\d+\.\d+|\d+)/);
  return match ? Number(match[1]) : null;
}

function splitNameAndSize(rawText: string): { name: string; size: string } {
  const sizeMatch = rawText.match(/(\d+(\.\d+)?\s?(g|kg|l|ml|pack)|\d+\s?x\s?\d+\s?(g|kg|l|ml))\b/i);
  if (!sizeMatch) return { name: rawText.trim(), size: "" };
  const idx = rawText.indexOf(sizeMatch[0]);
  return {
    name: rawText.slice(0, idx).trim(),
    size: rawText.slice(idx).trim(),
  };
}

function parseProductEntries(html: string): SpecialItem[] {
  const $ = cheerio.load(html);
  const items: SpecialItem[] = [];

  // Skip anything inside a carousel (e.g. "you might also like" ads)
  $("product-stamp-grid").each((_i, el) => {
    const $el = $(el);
    if ($el.parents(".carousel-track").length > 0) return;

    const strap = $el.find(".productStrap.isSpecial");
    if (strap.length === 0) return; // only keep genuine specials

    const titleH3 = $el.find('h3[id$="-title"]');
    const id = (titleH3.attr("id") ?? "").replace(/\D/g, "");
    if (!id) return;

    const rawNameAndSize = titleH3.text().trim().replace(/\s+/g, " ");
    const { name, size } = splitNameAndSize(rawNameAndSize);

    const priceH3 = $el.find(`h3[id="product-${id}-price"]`);
    const specialPrice = parseMoney(priceH3.attr("aria-label"));

    const wasSpan = $el.find(".price--was");
    const wasPrice = parseMoney(wasSpan.attr("aria-label"));

    const saveFromStrap = strap.find(".productStrap-text").text().trim();
    const saveSpan = $el.find(".price--save").text().trim();
    const saveText = saveFromStrap || saveSpan;

    const unitPrice = $el.find(".cupPrice").first().text().trim();

    const imageUrl = $el.find(".productImage-container img").attr("src") ?? "";

    if (specialPrice === null || !name) return;

    items.push({
      id,
      name,
      size,
      wasPrice,
      specialPrice,
      saveText,
      unitPrice,
      imageUrl,
    });
  });

  return items;
}

async function scrapeSpecials(): Promise<SpecialItem[]> {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();

  await page.route("**/*", async (route) => {
    const req = route.request();
    const blocked =
      TYPE_EXCLUSIONS.includes(req.resourceType()) ||
      URL_EXCLUSIONS.some((excluded) => req.url().includes(excluded));
    if (blocked) await route.abort();
    else await route.continue();
  });

  const allItems = new Map<string, SpecialItem>();

  try {
    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const url = `${SPECIALS_URL}?page=${pageNum}`;
      console.log(`Loading page ${pageNum}: ${url}`);

      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      console.log(`  response status: ${response?.status()} final url: ${page.url()}`);

      const foundPriceSelector = await page
        .waitForSelector("product-price h3", { timeout: 15000 })
        .then(() => true)
        .catch(() => false);

      if (!foundPriceSelector) {
        const bodyText = await page.innerText("body").catch(() => "");
        console.log(`  price selector not found. Page title: "${await page.title()}"`);
        console.log(`  body text sample: ${bodyText.slice(0, 500).replace(/\s+/g, " ")}`);
      }

      // Trigger lazy-loaded content
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("PageDown");
        await delay(400 + Math.random() * 400);
      }

      const gridHtml = await page.innerHTML("product-grid").catch(() => "");
      const pageItems = parseProductEntries(gridHtml);
      console.log(`  found ${pageItems.length} specials on page ${pageNum}`);
      pageItems.forEach((item) => allItems.set(item.id, item));

      // Stop once we hit a page with no pagination links left / no items
      const pageCount = await page
        .locator("ul.pagination li")
        .count()
        .catch(() => 0);
      const numPagesAvailable = Math.max(1, pageCount - 2);
      if (pageNum >= numPagesAvailable || pageItems.length === 0) break;

      await delay(PAGE_LOAD_DELAY_MS);
    }
  } finally {
    await browser.close();
  }

  return Array.from(allItems.values());
}

async function main() {
  const items = await scrapeSpecials();

  const data: SpecialsData = {
    scrapedAt: new Date().toISOString(),
    items,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`Wrote ${items.length} specials to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
