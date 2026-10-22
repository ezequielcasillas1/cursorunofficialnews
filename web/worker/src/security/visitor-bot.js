/** Heuristics to exclude bots, crawlers, and scrapers from live presence counts. */

const BOT_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /discordbot/i,
  /telegrambot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /claudebot/i,
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /curl\//i,
  /^wget\b/i,
  /python-requests/i,
  /go-http-client/i,
  /java\//i,
  /scrapy/i,
  /httpclient/i,
  /libwww-perl/i,
];

export function isKnownBotUserAgent(userAgent) {
  const ua = String(userAgent || '').trim();
  if (!ua) return true;
  return BOT_UA_PATTERNS.some((re) => re.test(ua));
}

/**
 * @param {import('hono').Context} c
 */
export function isAutomatedVisitorRequest(c) {
  if (isKnownBotUserAgent(c.req.header('user-agent'))) {
    return true;
  }

  const cf = c.req.raw?.cf;
  if (!cf) return false;

  const bot = cf.botManagement;
  if (bot?.verifiedBot === true) return true;
  if (typeof bot?.score === 'number' && bot.score < 30) return true;

  return false;
}
