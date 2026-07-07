import { LightningElement, api } from "lwc";
import { prefersReducedMotion } from "c/portfolioMotion";

const DEFAULT_LINKS = [
  { id: "about", number: "01", label: "About" },
  { id: "experience", number: "02", label: "Experience" },
  { id: "work", number: "03", label: "Work" },
  { id: "contact", number: "04", label: "Contact" }
];

const SCROLL_THRESHOLD = 40;

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
  /** URL the Resume button links to (hidden when empty). */
  @api resumeUrl;

  loaded = false;
  scrolled = false;
  _onScroll;

  get links() {
    return DEFAULT_LINKS.map((link, i) => ({
      ...link,
      href: `#${link.id}`,
      // First item after the logo starts at index 1 for the cascade.
      style: `--pf-delay: ${this.delayFor(i + 1)}`
    }));
  }

  get resumeStyle() {
    return `--pf-delay: ${this.delayFor(DEFAULT_LINKS.length + 1)}`;
  }

  get headerClass() {
    return `pf-header${this.scrolled ? " pf-header--scrolled" : ""}`;
  }

  delayFor(index) {
    // Stagger disabled under reduced motion so everything appears at once.
    return prefersReducedMotion() ? "0ms" : `${index * 100}ms`;
  }

  connectedCallback() {
    this._onScroll = this.handleScroll.bind(this);
    window.addEventListener("scroll", this._onScroll, { passive: true });
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
    }
  }

  handleScroll() {
    const isScrolled = window.scrollY > SCROLL_THRESHOLD;
    if (isScrolled !== this.scrolled) {
      this.scrolled = isScrolled;
    }
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
