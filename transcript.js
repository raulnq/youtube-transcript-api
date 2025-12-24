import { chromium } from 'playwright';
import { AppError } from './errorHandler.js';

const USER_AGENT =
  process.env.USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

/**
 * Parse cookies from YOUTUBE_COOKIES environment variable.
 * Supports both base64-encoded and raw JSON array formats.
 * @returns {Array} Array of cookie objects for Playwright, or empty array if not set/invalid
 */
function parseCookies() {
  const cookiesEnv = process.env.YOUTUBE_COOKIES;
  if (!cookiesEnv) return [];

  // Map browser extension sameSite values to Playwright values
  const mapSameSite = sameSite => {
    const mapping = {
      no_restriction: 'None',
      lax: 'Lax',
      strict: 'Strict',
      unspecified: 'Lax',
    };
    return mapping[sameSite?.toLowerCase()] || 'Lax';
  };

  let jsonString = cookiesEnv;

  // Try to decode as base64 first (recommended for Docker/Coolify deployments)
  try {
    const decoded = Buffer.from(cookiesEnv, 'base64').toString('utf-8');
    // Check if decoded string looks like JSON array
    if (decoded.trim().startsWith('[')) {
      jsonString = decoded;
    }
  } catch {
    // Not base64, use as-is
  }

  try {
    const cookies = JSON.parse(jsonString);
    if (!Array.isArray(cookies)) {
      console.warn('YOUTUBE_COOKIES must be a JSON array');
      return [];
    }

    // Ensure each cookie has required fields and defaults
    return cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain || '.youtube.com',
      path: cookie.path || '/',
      secure: cookie.secure ?? true,
      httpOnly: cookie.httpOnly ?? false,
      sameSite: mapSameSite(cookie.sameSite),
    }));
  } catch (error) {
    console.warn('Failed to parse YOUTUBE_COOKIES:', error.message);
    return [];
  }
}

// Human simulation utilities
const randomDelay = (min = 100, max = 500) =>
  new Promise(resolve =>
    setTimeout(resolve, Math.random() * (max - min) + min)
  );

async function humanScroll(page) {
  const scrolls = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < scrolls; i++) {
    const scrollAmount = Math.floor(Math.random() * 300) + 100;
    await page.mouse.wheel(0, scrollAmount);
    await randomDelay(200, 600);
  }
}

async function humanMouseMove(page, element) {
  const box = await element.boundingBox();
  if (!box) return;

  // Get current viewport size
  const viewport = page.viewportSize();

  // Start from a random position
  const startX = Math.floor(Math.random() * viewport.width);
  const startY = Math.floor(Math.random() * viewport.height);

  // Target center of element with slight randomness
  const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * 10;
  const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * 10;

  // Move in steps to simulate human movement
  const steps = Math.floor(Math.random() * 10) + 5;
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    // Ease-out curve for more natural movement
    const eased = 1 - Math.pow(1 - progress, 2);
    const x = startX + (targetX - startX) * eased;
    const y = startY + (targetY - startY) * eased;
    await page.mouse.move(x, y);
    await randomDelay(10, 30);
  }
}

async function humanClick(page, element) {
  await humanMouseMove(page, element);
  await randomDelay(50, 150);
  await element.click();
}

const selectors = {
  expand: process.env.EXPAND_SELECTOR || 'tp-yt-paper-button#expand',
  notFound:
    process.env.NOT_FOUND_SELECTOR ||
    'div.promo-title:has-text("This video isn\'t available anymore"), div.promo-title:has-text("Este video ya no está disponible")',
  showTranscript:
    process.env.SHOW_TRANSCRIPT_SELECTOR ||
    'button[aria-label="Show transcript"], button[aria-label="Mostrar transcripción"]',
  viewCount: process.env.VIEW_COUNT_SELECTOR || 'yt-formatted-string#info span',
  transcriptSegment:
    process.env.TRANSCRIPT_SEGMENT_SELECTOR ||
    'ytd-transcript-segment-renderer',
  transcript: process.env.TRANSCRIPT_SELECTOR || 'ytd-transcript-renderer',
  text: process.env.TRANSCRIPT_TEXT_SELECTOR || '.segment-text',
};

export default async function getTranscript(videoId) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled', // Main stealth flag
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: USER_AGENT,
    //locale: 'en-US',
  });

  // Add cookies if provided via environment variable
  const cookies = parseCookies();
  if (cookies.length > 0) {
    await context.addCookies(cookies);
  }

  const page = await context.newPage();
  try {
    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Initial random delay to simulate page reading
    await randomDelay(500, 1500);

    const errorElement = await page.$(selectors.notFound);
    if (errorElement) {
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
      });
      const base64Screenshot = screenshot.toString('base64');
      throw new AppError('Video not found or unavailable', 'not_found', 404, {
        screenshot: `data:image/png;base64,${base64Screenshot}`,
      });
    }

    // Simulate human scrolling behavior
    await humanScroll(page);
    await randomDelay(300, 800);

    const expandButton = await page.$(selectors.expand);
    if (!expandButton) {
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
      });
      const base64Screenshot = screenshot.toString('base64');
      throw new AppError('Expand button not found', 'validation', 400, {
        screenshot: `data:image/png;base64,${base64Screenshot}`,
      });
    }

    await humanClick(page, expandButton);
    await randomDelay(200, 500);

    const showTranscriptButton = await page.$(selectors.showTranscript);
    if (!showTranscriptButton) {
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
      });
      const base64Screenshot = screenshot.toString('base64');
      throw new AppError(
        'Show transcript button not found',
        'validation',
        400,
        {
          screenshot: `data:image/png;base64,${base64Screenshot}`,
        }
      );
    }

    await humanClick(page, showTranscriptButton);

    await page.waitForSelector(selectors.transcript, { timeout: 30000 });

    const transcript = await page.$$eval(
      selectors.transcriptSegment,
      (nodes, textSelector) => {
        return nodes.map(n => n.querySelector(textSelector)?.innerText.trim());
      },
      selectors.text
    );

    const [viewsText] = await page.$$eval(selectors.viewCount, nodes =>
      nodes.map(n => n.innerText.trim())
    );

    const views = parseInt(viewsText.replace(/[^0-9]/g, ''), 10) || 0;

    return { transcript: transcript.join(' '), views };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png',
    });
    const base64Screenshot = screenshot.toString('base64');
    throw new AppError(
      `Failed to fetch transcript: ${error.message}`,
      'error',
      500,
      {
        screenshot: `data:image/png;base64,${base64Screenshot}`,
      }
    );
  } finally {
    await browser.close();
  }
}
