import { LightningElement } from "lwc";

/**
 * portfolioTheme — global design-token bootstrapper.
 *
 * The LWR site's managed `styles.css` can't be updated reliably through the
 * CLI (it stays the default placeholder), so the `:root` design tokens and the
 * global page background never reach the published page — everything renders on
 * white with per-component fallback colors.
 *
 * This component renders nothing; on load it injects the canonical token
 * stylesheet into `document.head` (once), so the tokens cascade everywhere —
 * including into every LWC shadow tree, because CSS custom properties pierce the
 * shadow boundary. It's placed in the theme layout so it loads on every page.
 *
 * Keep TOKENS in sync with `staticresources/portfolioDesignTokens.css` and the
 * site `styles.css` — this is the runtime source of truth on the live site.
 */
const STYLE_ID = "pf-global-tokens";

// Module-scoped guard so the tokens are injected once per page, no matter how
// many instances mount (querying document for an existing node is disallowed).
let injected = false;

const TOKENS = `
:root,
:root[data-theme="dark"] {
  --pf-bg: #0a192f;
  --pf-bg-light: #112240;
  --pf-bg-lightest: #233554;
  --pf-bg-overlay: rgba(2, 12, 27, 0.7);
  --pf-slate: #8892b0;
  --pf-slate-light: #a8b2d1;
  --pf-slate-lightest: #ccd6f6;
  --pf-white: #e6f1ff;
  --pf-heading: var(--pf-slate-lightest);
  --pf-accent: #64ffda;
  --pf-accent-tint: rgba(100, 255, 218, 0.1);
  --pf-accent-tint-strong: rgba(100, 255, 218, 0.15);
  --pf-shadow: rgba(2, 12, 27, 0.7);
}
:root[data-theme="light"] {
  --pf-bg: #f5f7fb;
  --pf-bg-light: #ffffff;
  --pf-bg-lightest: #e3e9f4;
  --pf-bg-overlay: rgba(245, 247, 251, 0.7);
  --pf-slate: #5a6785;
  --pf-slate-light: #47536b;
  --pf-slate-lightest: #1b2540;
  --pf-white: #0a192f;
  --pf-heading: var(--pf-slate-lightest);
  --pf-accent: #0a8f74;
  --pf-accent-tint: rgba(10, 143, 116, 0.1);
  --pf-accent-tint-strong: rgba(10, 143, 116, 0.15);
  --pf-shadow: rgba(99, 114, 145, 0.25);
}
:root {
  --pf-font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  --pf-font-mono: "SF Mono", "Fira Code", "Roboto Mono", ui-monospace,
    "Courier New", monospace;
  --pf-fs-xs: 0.75rem;
  --pf-fs-sm: 0.875rem;
  --pf-fs-base: 1rem;
  --pf-fs-lg: 1.25rem;
  --pf-fs-xl: clamp(2rem, 8vw, 5rem);
  --pf-space-1: 0.25rem;
  --pf-space-2: 0.5rem;
  --pf-space-3: 1rem;
  --pf-space-4: 1.5rem;
  --pf-space-5: 2rem;
  --pf-space-6: 3rem;
  --pf-space-7: 5rem;
  --pf-nav-height: 100px;
  --pf-nav-height-scrolled: 70px;
  --pf-max-width: 1600px;
  --pf-content-width: 1000px;
  --pf-rail-width: 40px;
  --pf-ease: cubic-bezier(0.645, 0.045, 0.355, 1);
  --pf-duration-fast: 0.2s;
  --pf-duration: 0.4s;
  --pf-duration-slow: 0.6s;
  --pf-stagger: 100ms;
  --pf-z-rails: 10;
  --pf-z-nav: 100;
}
html {
  background: var(--pf-bg) !important;
  scroll-behavior: smooth;
}
body {
  background: var(--pf-bg) !important;
  color: var(--pf-slate);
  font-family: var(--pf-font-sans);
  transition:
    background-color var(--pf-duration) var(--pf-ease),
    color var(--pf-duration) var(--pf-ease);
}
::selection {
  background: var(--pf-accent-tint-strong);
  color: var(--pf-white);
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
`;

export default class PortfolioTheme extends LightningElement {
  connectedCallback() {
    if (injected || typeof document === "undefined" || !document.head) {
      return;
    }
    injected = true;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = TOKENS;
    document.head.appendChild(style);
  }
}
