import { chromium } from 'playwright';
import { AppError } from './errorHandler.js';

const USER_AGENT =
  process.env.USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
    });

    const page = await context.newPage();

    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

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

    await expandButton.click({ timeout: 5000 });

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

    await showTranscriptButton.click({ timeout: 5000 });

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
    throw new AppError(
      `Failed to fetch transcript: ${error.message}`,
      'error',
      500
    );
  } finally {
    await browser.close();
  }
}
