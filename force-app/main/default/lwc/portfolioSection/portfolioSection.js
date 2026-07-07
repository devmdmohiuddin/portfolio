import { LightningElement, api } from "lwc";
import { revealOnScroll } from "c/portfolioMotion";

/**
 * portfolioSection — shared section wrapper.
 *
 * Provides the consistent "01. Section Title" numbered heading and a slot
 * for section content, and wires each section into the scroll-reveal
 * motion toolkit so it fades/slides up as it enters the viewport.
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

  get hasHeading() {
    return Boolean(this.sectionTitle);
  }

  get headingId() {
    return this.sectionId ? `${this.sectionId}-heading` : "pf-section-heading";
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
  }
}
