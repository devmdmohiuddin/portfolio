import { LightningElement, api } from "lwc";
import { revealOnScroll, prefersReducedMotion } from "c/portfolioMotion";

/**
 * portfolioSection — shared section wrapper.
 *
 * Provides the consistent "01. Section Title" numbered heading and a slot
 * for section content, and wires each section into the scroll-reveal
 * motion toolkit so it fades/slides up as it enters the viewport.
 *
 * Sections live in their own shadow trees, so nav anchor clicks can't reach
 * them via `#fragment`. Instead each section listens for the nav's composed
 * `sectionnavigate` event on window and smooth-scrolls itself into view when
 * its own id is requested.
 */
export default class PortfolioSection extends LightningElement {
  /** Anchor id used for nav links / smooth scrolling (e.g. "about"). */
  @api sectionId;
  /** Two-digit ordinal shown before the title (e.g. "01"). */
  @api sectionNumber;
  /** Section heading text (e.g. "About Me"). */
  @api sectionTitle;

  _disconnect;
  _observed = false;
  _onNavigate;

  get hasHeading() {
    return Boolean(this.sectionTitle);
  }

  get headingId() {
    return this.sectionId ? `${this.sectionId}-heading` : "pf-section-heading";
  }

  /** Only reference the heading when one is rendered (undefined removes the attribute). */
  get ariaLabelledBy() {
    return this.hasHeading ? this.headingId : undefined;
  }

  connectedCallback() {
    this._onNavigate = this.handleSectionNavigate.bind(this);
    window.addEventListener("sectionnavigate", this._onNavigate);
  }

  renderedCallback() {
    if (this._observed) {
      return;
    }
    this._observed = true;
    const target = this.template.querySelector("[data-reveal]");
    this._disconnect = revealOnScroll(target ? [target] : []);
  }

  disconnectedCallback() {
    if (this._disconnect) {
      this._disconnect();
    }
    if (this._onNavigate) {
      window.removeEventListener("sectionnavigate", this._onNavigate);
    }
  }

  handleSectionNavigate(event) {
    if (!this.sectionId || event.detail?.sectionId !== this.sectionId) {
      return;
    }
    const section = this.template.querySelector(".pf-section");
    if (section) {
      // `scroll-margin-top` on the section keeps it clear of the sticky nav.
      section.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start"
      });
    }
  }
}
