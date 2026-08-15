const PATHS = {
  'arrow-right': 'M5 12h14m-6-6 6 6-6 6',
  'arrow-up-right': 'M7 17 17 7M8 7h9v9',
  check: 'm5 13 4 4L19 7',
  crosshair:
    'M12 2v3m0 14v3M2 12h3m14 0h3M12 12m-7 0a7 7 0 1 0 14 0 7 7 0 0 0-14 0',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  x: 'M6 6l12 12M18 6 6 18',
  rss: 'M5 11a8 8 0 0 1 8 8m-8-12a12 12 0 0 1 12 12M6 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  gamepad:
    'M6 12h4m-2-2v4m7-3h.01M18 13h.01M17.3 5H6.7a4 4 0 0 0-4 3.6L2 15a2.5 2.5 0 0 0 4.3 1.7L8 14h8l1.7 2.7A2.5 2.5 0 0 0 22 15l-.7-6.4a4 4 0 0 0-4-3.6Z',
};

export function Icon({ name, width = 16, className = '' }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={width}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
