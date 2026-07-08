import { LightningElement, wire } from "lwc";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";
import { revealOnScroll, stagger } from "c/portfolioMotion";

/**
 * portfolioContact — the "04. What's Next?" closing CTA.
 *
 * Centered overline + "Get In Touch" heading, the availability message
 * from Portfolio_Config__mdt, and a Say Hello mailto button pointed at
 * the config email — so both the copy and the address are data.
 *
 * Motion: overline, heading, message, and CTA fade up in sequence as the
 * section scrolls into view; the button gets the shared accent fill/lift
 * on hover. Static under `prefers-reduced-motion`.
 */
export default class PortfolioContact extends LightningElement {
  email;
  availabilityMessage;
  loaded = false;

  _disconnect;
  _observed = false;

  @wire(getConfig)
  wiredConfig({ data, error }) {
    if (data) {
      this.email = data.Email__c;
      this.availabilityMessage = data.Availability_Message__c;
      this.loaded = true;
    } else if (error) {
      this.loaded = true;
    }
  }

  get mailto() {
    return this.email ? `mailto:${this.email}` : undefined;
  }

  renderedCallback() {
    // Wait for config so the message + CTA are in the DOM before observing.
    if (this._observed || !this.loaded) {
      return;
    }
    this._observed = true;
    const items = this.template.querySelectorAll("[data-reveal]");
    stagger(items);
    this._disconnect = revealOnScroll(items);
  }

  disconnectedCallback() {
    if (this._disconnect) {
      this._disconnect();
    }
  }
}
