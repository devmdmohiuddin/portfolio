import { LightningElement, wire } from "lwc";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";
import { revealOnScroll, stagger } from "c/portfolioMotion";

/**
 * portfolioAbout — the "01. About Me" section.
 *
 * Everything is data from Portfolio_Config__mdt: the about copy (About__c,
 * blank-line-separated paragraphs), the tech list (Tech_List__c, one per
 * line), and the profile photo (Photo_URL__c). Editing the Default config
 * record updates the section — no deploy.
 *
 * Motion: the text block and photo reveal on scroll, tech items cascade in
 * with a stagger, and the photo carries the accent-framed hover treatment.
 * All of it collapses to static under `prefers-reduced-motion`.
 */
export default class PortfolioAbout extends LightningElement {
  config;
  error;

  _disconnect;
  _observedCount = 0;

  @wire(getConfig)
  wiredConfig({ data, error }) {
    if (data) {
      this.config = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.config = undefined;
    }
  }

  /** About copy split into paragraphs on blank lines. */
  get paragraphs() {
    const about = this.config?.About__c || "";
    return about
      .split(/\n\s*\n/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: `para-${i}`, text }));
  }

  /** Tech tags, one per Tech_List__c line. */
  get techItems() {
    const list = this.config?.Tech_List__c || "";
    return list
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name, i) => ({ id: `tech-${i}`, name }));
  }

  get hasTech() {
    return this.techItems.length > 0;
  }

  get photoUrl() {
    return this.config?.Photo_URL__c;
  }

  get photoAlt() {
    const name = this.config?.Full_Name__c;
    return name ? `Portrait of ${name}` : "Profile photo";
  }

  renderedCallback() {
    // Reveal targets render only once config data lands, and more can appear
    // as fields fill in — (re)observe whenever new [data-reveal] nodes show up.
    const targets = this.template.querySelectorAll("[data-reveal]");
    if (targets.length === this._observedCount) {
      return;
    }
    this._observedCount = targets.length;
    if (this._disconnect) {
      this._disconnect();
    }
    stagger(this.template.querySelectorAll(".pf-about__tech-item"), 60);
    this._disconnect = revealOnScroll(targets);
  }

  disconnectedCallback() {
    if (this._disconnect) {
      this._disconnect();
    }
  }
}
