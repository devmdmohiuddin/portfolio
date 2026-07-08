import { LightningElement, track } from "lwc";

const STORAGE_KEY = "pf-theme";
const DARK = "dark";
const LIGHT = "light";

/**
 * themeToggle — dark ⇄ light switch.
 *
 * Flips the `data-theme` attribute on <html>, which every design token keys
 * off of, so a single toggle restyles the whole page. The choice persists to
 * localStorage; with no stored choice it follows the OS `prefers-color-scheme`
 * (and keeps following it until the user makes an explicit selection).
 */
export default class ThemeToggle extends LightningElement {
  @track theme = DARK;
  _mql;
  _onSystemChange;

  connectedCallback() {
    this.theme = this.resolveInitialTheme();
    this.applyTheme();

    // Follow the OS setting only while the user hasn't chosen explicitly.
    if (this.supportsMatchMedia()) {
      this._mql = window.matchMedia("(prefers-color-scheme: light)");
      this._onSystemChange = (event) => {
        if (this.hasStoredPreference()) {
          return;
        }
        this.theme = event.matches ? LIGHT : DARK;
        this.applyTheme();
      };
      // addEventListener is the modern API; guard for older Safari.
      if (typeof this._mql.addEventListener === "function") {
        this._mql.addEventListener("change", this._onSystemChange);
      }
    }
  }

  disconnectedCallback() {
    if (this._mql && typeof this._mql.removeEventListener === "function") {
      this._mql.removeEventListener("change", this._onSystemChange);
    }
  }

  get isLight() {
    return this.theme === LIGHT;
  }

  get buttonClass() {
    return this.isLight
      ? "pf-theme-toggle pf-theme-toggle--light"
      : "pf-theme-toggle";
  }

  get nextThemeLabel() {
    return this.isLight ? "Switch to dark theme" : "Switch to light theme";
  }

  handleToggle() {
    this.theme = this.isLight ? DARK : LIGHT;
    this.storePreference(this.theme);
    this.applyTheme();
  }

  /** Apply the current theme to the document root so tokens re-cascade. */
  applyTheme() {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("data-theme", this.theme);
    }
  }

  resolveInitialTheme() {
    const stored = this.readStoredPreference();
    if (stored === DARK || stored === LIGHT) {
      return stored;
    }
    if (this.supportsMatchMedia()) {
      return window.matchMedia("(prefers-color-scheme: light)").matches
        ? LIGHT
        : DARK;
    }
    return DARK;
  }

  supportsMatchMedia() {
    return (
      typeof window !== "undefined" && typeof window.matchMedia === "function"
    );
  }

  hasStoredPreference() {
    const stored = this.readStoredPreference();
    return stored === DARK || stored === LIGHT;
  }

  readStoredPreference() {
    try {
      return typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    } catch {
      // Private mode / blocked storage — fall back to system preference.
      return null;
    }
  }

  storePreference(value) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, value);
      }
    } catch {
      // Ignore storage failures; the toggle still works for this session.
    }
  }
}
