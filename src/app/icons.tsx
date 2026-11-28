/** A few line icons, drawn in the text colour. Decorative: the text next to them says what they mean. */

const base = {
  viewBox: '0 0 24 24',
  width: '1em', // text-sized unless CSS says otherwise; without this an icon stretches to fill its line
  height: '1em',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const SpeakerIcon = () => (
  <svg {...base}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...base} strokeWidth={2.5}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const ArrowLeftIcon = () => (
  <svg {...base}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const ArrowRightIcon = () => (
  <svg {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const RestartIcon = () => (
  <svg {...base}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const StopIcon = () => (
  <svg {...base}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

/** The app's mark: three piano keys, the middle one lit. */
export const BrandMark = () => (
  <svg className="brand-mark" viewBox="0 0 26 26" aria-hidden="true">
    <rect x="1" y="2" width="7" height="22" rx="2" fill="#f3f1ea" />
    <rect x="9.5" y="2" width="7" height="22" rx="2" fill="#f0a43a" />
    <rect x="18" y="2" width="7" height="22" rx="2" fill="#f3f1ea" />
    <rect x="6" y="2" width="4.5" height="13" rx="1.2" fill="#121316" />
    <rect x="15.5" y="2" width="4.5" height="13" rx="1.2" fill="#121316" />
  </svg>
);
