import { LightningElement, api, wire } from "lwc";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";
import { prefersReducedMotion } from "c/portfolioMotion";

const DEFAULT_LINKS = [
  { id: "about", number: "01", label: "About" },
  { id: "experience", number: "02", label: "Experience" },
  { id: "work", number: "03", label: "Work" },
  { id: "contact", number: "04", label: "Contact" }
];

const SCROLL_THRESHOLD = 40;
// Only start hiding the bar once it has fully scrolled past (≈ its height),
// so a small jitter near the top never yanks it away.
const HIDE_AFTER = 120;

/**
 * portfolioNav — sticky top navigation.
 *
 * Renders the monogram logo, the 01–04 section links, and the Resume
 * button. Entrance is a staggered fade/slide-in on load; the bar shrinks
 * and gains a shadow once the page is scrolled. Links smooth-scroll to
 * their section (falling back to a composed `sectionnavigate` event so a
 * page-level host can handle sections that live in sibling shadow trees).
 */
export default class PortfolioNav extends LightningElement {
  /** Monogram shown in the logo (defaults to "MM"). */
  @api initials = "MM";
  /**
   * Optional Resume URL override. When blank (the default) the button falls
   * back to the config record's Resume URL, keeping the link data-driven.
   */
  @api resumeUrl;

  config;
  loaded = false;
  scrolled = false;
  hidden = false;
  _lastScrollY = 0;
  _onScroll;

  @wire(getConfig)
  wiredConfig({ data }) {
    if (data) {
      this.config = data;
    }
  }

  /**
   * Effective Resume link. The config record is the source of truth; the
   * builder-set `resumeUrl` is a fallback for environments where the config
   * value isn't set yet. Hidden when neither is present.
   */
  get resumeHref() {
    return this.config?.Resume_URL__c || this.resumeUrl || undefined;
  }

  get links() {
    return DEFAULT_LINKS.map((link, i) => ({
      ...link,
      href: `#${link.id}`,
      // First item after the logo starts at index 1 for the cascade.
      style: `--pf-delay: ${this.delayFor(i + 1)}`
    }));
  }

  get toggleStyle() {
    return `--pf-delay: ${this.delayFor(DEFAULT_LINKS.length + 1)}`;
  }

  get resumeStyle() {
    return `--pf-delay: ${this.delayFor(DEFAULT_LINKS.length + 2)}`;
  }

  get headerClass() {
    return [
      "pf-header",
      this.scrolled ? "pf-header--scrolled" : "",
      this.hidden ? "pf-header--hidden" : ""
    ]
      .filter(Boolean)
      .join(" ");
  }

  delayFor(index) {
    // Stagger disabled under reduced motion so everything appears at once.
    return prefersReducedMotion() ? "0ms" : `${index * 100}ms`;
  }

  connectedCallback() {
    this._onScroll = this.handleScroll.bind(this);
    window.addEventListener("scroll", this._onScroll, { passive: true });
    // Experience Cloud LWR often scrolls an inner container rather than the
    // window. Scroll events don't bubble, so listen in the capture phase on
    // the document to catch scrolling from whichever element actually scrolls.
    document.addEventListener("scroll", this._onScroll, {
      passive: true,
      capture: true
    });
  }

  renderedCallback() {
    if (this.loaded) {
      return;
    }
    // Defer one frame so the start state paints before the transition.
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    requestAnimationFrame(() => {
      this.loaded = true;
    });
  }

  disconnectedCallback() {
    if (this._onScroll) {
      window.removeEventListener("scroll", this._onScroll);
      document.removeEventListener("scroll", this._onScroll, { capture: true });
    }
  }

  /**
   * Current vertical scroll offset. Reads the scrolling element when the event
   * comes from an inner container (LWR), else falls back to the window/document.
   */
  scrollTopFrom(event) {
    const target = event && event.target;
    if (
      target &&
      target.nodeType === 1 &&
      target !== document.documentElement &&
      target !== document.body &&
      typeof target.scrollTop === "number"
    ) {
      return target.scrollTop;
    }
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  }

  handleScroll(event) {
    const y = this.scrollTopFrom(event);

    // Shrink + shadow once the page moves off the very top.
    const isScrolled = y > SCROLL_THRESHOLD;
    if (isScrolled !== this.scrolled) {
      this.scrolled = isScrolled;
    }

    // Hide the bar when scrolling down past its height; bring it straight back
    // the moment the user scrolls up (or returns near the top).
    const scrollingDown = y > this._lastScrollY;
    let nextHidden = this.hidden;
    if (y <= HIDE_AFTER) {
      nextHidden = false;
    } else if (scrollingDown) {
      nextHidden = true;
    } else {
      nextHidden = false;
    }
    if (nextHidden !== this.hidden) {
      this.hidden = nextHidden;
    }

    this._lastScrollY = y;
  }

  handleNavClick(event) {
    const targetId = event.currentTarget.dataset.target;
    if (!targetId) {
      return;
    }
    event.preventDefault();

    if (targetId === "top") {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      });
      return;
    }

    // Sections live in sibling shadow trees, so let a page-level host resolve
    // the target and perform the smooth scroll (wired as sections ship).
    this.dispatchEvent(
      new CustomEvent("sectionnavigate", {
        detail: { sectionId: targetId },
        bubbles: true,
        composed: true
      })
    );
  }
}
