import { LightningElement, wire } from "lwc";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";
import { prefersReducedMotion } from "c/portfolioMotion";

/**
 * portfolioHero — the landing section.
 *
 * Renders "Hi, my name is / {Name} / {Tagline}", the intro, and a CTA — all
 * from Portfolio_Config__mdt, so the copy is data, not code. On load the
 * lines reveal in a staggered cascade (greeting types in like a terminal);
 * everything collapses to a static state under `prefers-reduced-motion`.
 */
export default class PortfolioHero extends LightningElement {
  config;
  error;
  /** Flips to true after first paint so the CSS entrance can run. */
  loaded = false;

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

  /** Fixed greeting line; the character count keys the typewriter width. */
  get greeting() {
    return "Hi, my name is.";
  }

  get fullName() {
    return this.config?.Full_Name__c || "";
  }

  get tagline() {
    return this.config?.Tagline__c || "";
  }

  get intro() {
    return this.config?.Intro__c || "";
  }

  get email() {
    return this.config?.Email__c;
  }

  /** CTA points at the config email; hidden entirely when no email is set. */
  get ctaHref() {
    return this.email ? `mailto:${this.email}` : undefined;
  }

  renderedCallback() {
    if (this.loaded) {
      return;
    }
    if (prefersReducedMotion()) {
      // No entrance to schedule — show everything immediately.
      this.loaded = true;
      return;
    }
    // Defer a frame so the start state paints before the transition kicks in.
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    requestAnimationFrame(() => {
      this.loaded = true;
    });
  }
}
