import { useState } from 'react';
import { APP_NAME } from '../config.js';
import { HEADER_NAV } from '../config/siteNav.js';
import { useSiteViews } from '../hooks/useSiteViews.js';
import { SupporterSlot } from './SupporterSlot.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { Tooltip } from './Tooltip.jsx';
import { Icon } from './ui/Icon.jsx';

const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com/casiezeq' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@casiezeq' },
  { label: 'Instagram @casiezeq', href: 'https://www.instagram.com/casiezeq' },
  { label: 'Reddit', href: 'https://reddit.com/user/Ok-Address3409' },
];

const MARQUEE_WORDS = [
  { text: 'CHANGELOG', serif: false },
  { text: 'Releases', serif: true },
  { text: 'BLOG', serif: false, gold: true },
  { text: 'Forum', serif: true },
  { text: 'COMMUNITY', serif: false },
  { text: 'Tutorials', serif: true },
  { text: 'VIDEOS', serif: false },
  { text: 'Issues', serif: true },
  { text: 'DISCUSSION', serif: false, gold: true },
  { text: 'Unofficial', serif: true },
];

function BrandMark() {
  return (
    <a href="/" className="flex items-center gap-2.5 group">
      <img
        src="/brand/logo-icon.svg"
        alt=""
        width={24}
        height={24}
        decoding="async"
        className="transition-transform duration-300 group-hover:scale-110"
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
      <span className="font-display font-semibold text-sm tracking-tight uppercase text-[var(--color-ink)]">
        Unofficial <span className="text-[var(--color-gold)]">Cursor News</span>
      </span>
    </a>
  );
}

function WaveBackground() {
  return (
    <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0 w-[200%] h-full wave-bg animate-wave-slow"
        style={{ backgroundRepeat: 'repeat-x' }}
      />
      <div
        className="absolute inset-0 w-[200%] h-full wave-bg animate-wave-slower opacity-50"
        style={{ backgroundPosition: '0 50px', backgroundRepeat: 'repeat-x', transform: 'scaleY(1.2)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-paper)] via-[var(--color-paper)]/80 to-transparent" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, var(--color-paper) 100%)',
        }}
      />
    </div>
  );
}

function Marquee() {
  const row = (key) => (
    <div key={key} className="flex gap-20 items-center px-10 opacity-30">
      {MARQUEE_WORDS.map((word) => (
        <span
          key={word.text}
          className={`text-2xl tracking-tight whitespace-nowrap ${
            word.serif ? 'font-serif-accent' : 'font-display font-semibold'
          } ${word.gold ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink)]'}`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );

  return (
    <section
      aria-hidden="true"
      className="border-y border-[var(--color-border)] bg-[var(--color-paper-warm)]/40 overflow-hidden py-6"
    >
      <div className="flex whitespace-nowrap animate-marquee">
        {row('a')}
        {row('b')}
      </div>
    </section>
  );
}

function HeroStatusCard({ status }) {
  const lastIngest = status?.lastIngestAt ? new Date(status.lastIngestAt) : null;
  const updatedLabel =
    lastIngest && !Number.isNaN(lastIngest.getTime())
      ? lastIngest.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : null;

  return (
    <div
      className="relative h-[420px] w-full rounded-3xl border border-[var(--color-border)] overflow-hidden animate-fade-up group backdrop-blur-sm bg-[var(--color-card)]/40"
      style={{ animationDelay: '0.2s' }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-8 rounded-full border border-[var(--color-border)] animate-spin-slow" />
        <div
          className="absolute inset-16 rounded-full border border-dashed border-[var(--color-border)] animate-spin-slow"
          style={{ animationDirection: 'reverse' }}
        />
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-paper-deep)] shadow-2xl z-10 group-hover:border-[var(--color-gold)]/40 transition-colors duration-500 flex items-center justify-center bg-[var(--color-paper-warm)]">
          <img
            src="/brand/logo-icon.svg"
            alt=""
            width={72}
            height={72}
            className="opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
        </div>
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[var(--color-paper-deep)]/90 border border-[var(--color-border)] backdrop-blur-md text-[10px] uppercase font-bold tracking-widest text-[var(--color-ink)] shadow-xl whitespace-nowrap">
          FEED: <span className="text-[var(--color-gold)]">Active</span>
        </div>
      </div>

      <div className="flex bg-[var(--color-paper-deep)]/70 border-[var(--color-border)] border rounded-2xl p-4 absolute right-6 bottom-6 left-6 backdrop-blur-md items-center justify-between gap-4">
        <div>
          <p className="text-[var(--color-ink)] text-xs font-bold uppercase tracking-widest">
            Latest ingest
          </p>
          <p className="text-[var(--color-gold)] text-[10px] uppercase tracking-wider mt-1">
            {updatedLabel ? `Updated ${updatedLabel}` : 'Updates every ~30 min'}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-light)]">
            {status?.sourceCount ? `${status.sourceCount} sources` : 'Sources'}
          </span>
          <div className="w-24 h-1 bg-[var(--color-border)] rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-[var(--color-gold)] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ status, onlineCount }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        <WaveBackground />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10 w-full">
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest rounded-full px-3 py-1 border border-[var(--color-border-subtle)] bg-[var(--color-card)]/50 backdrop-blur-sm text-[var(--color-ink-soft)]">
              <span className="ping-dot" aria-hidden="true" />
              Independent fan briefing
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-[var(--color-ink)] leading-[0.9] m-0">
              CURSOR
              <br />
              <span className="font-serif-accent text-[var(--color-ink-muted)]">news, unofficially.</span>
            </h1>

            <p className="text-sm md:text-base text-[var(--color-ink-muted)] max-w-md leading-relaxed font-light m-0">
              Independent Cursor briefing — changelogs, releases, and community, with original notes
              on every story. Never the full article: tap through to the original publisher.
            </p>

            <div className="flex items-center gap-4 pt-2 flex-wrap">
              <a
                href="#feed"
                className="h-12 px-8 bg-[var(--color-gold)] text-[#0a0a0a] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[var(--color-gold-bright)] transition-all flex items-center gap-2 group no-underline"
              >
                Browse the feed
                <Icon
                  name="arrow-right"
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
              <a
                href="/editorial-policy"
                className="h-12 px-8 border border-[var(--color-border)] text-[var(--color-ink)] text-xs font-bold uppercase tracking-widest rounded-full hover:border-[var(--color-gold)]/60 hover:text-[var(--color-gold-bright)] transition-colors flex items-center no-underline"
              >
                Editorial policy
              </a>
            </div>

            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-widest text-[var(--color-ink-light)] m-0">
              <span>{today}</span>
              {onlineCount !== null ? (
                <span aria-live="polite" className="text-[var(--color-gold)]">
                  {onlineCount.toLocaleString()} {onlineCount === 1 ? 'person' : 'people'} online
                </span>
              ) : null}
              <span className="flex gap-3">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-gold-bright)] transition-colors no-underline text-[var(--color-ink-light)]"
                  >
                    {link.label}
                  </a>
                ))}
              </span>
            </p>
          </div>

          <HeroStatusCard status={status} />
        </div>
      </section>
      <Marquee />
    </>
  );
}

export function Header({ onRefresh, refreshing, hero = false, status = null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const onlineCount = useSiteViews();

  return (
    <header className={hero ? '' : 'pb-4'}>
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--color-border)] bg-[var(--color-paper)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <BrandMark />

          <div className="hidden lg:flex items-center gap-7 text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-widest">
            {HEADER_NAV.map((link) => (
              <Tooltip key={link.href} text={link.tooltip}>
                <a
                  href={link.href}
                  className="hover:text-[var(--color-ink)] transition-colors duration-200 no-underline text-[var(--color-ink-muted)]"
                >
                  {link.label}
                </a>
              </Tooltip>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="hidden sm:inline-flex h-9 px-4 items-center rounded-full border border-[var(--color-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)]/60 transition-colors disabled:opacity-50"
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            ) : null}
            <SupporterSlot variant="inline" />
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-border)] text-[var(--color-ink)]"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? 'x' : 'menu'} width={18} />
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="lg:hidden border-t border-[var(--color-border)] bg-[var(--color-paper)]/95 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 text-xs font-semibold uppercase tracking-widest">
              {HEADER_NAV.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-2 text-[var(--color-ink-muted)] hover:text-[var(--color-gold-bright)] transition-colors no-underline"
                >
                  {link.label}
                </a>
              ))}
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="self-start h-9 px-4 rounded-full border border-[var(--color-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] disabled:opacity-50"
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </nav>

      {hero ? <Hero status={status} onlineCount={onlineCount} /> : <div className="h-16" aria-hidden="true" />}
    </header>
  );
}

export function DisclaimerBanner() {
  return null;
}
