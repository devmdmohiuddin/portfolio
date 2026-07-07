import { LightningElement, api } from "lwc";
import { prefersReducedMotion } from "c/portfolioMotion";

/**
 * portfolioRails — sticky left (social) and right (email) rails.
 *
 * Fixed to the viewport edges on desktop and hidden on smaller screens.
 * Both rails slide up into place after load with a short stagger. Social
 * links are supplied as config so no URLs are hardcoded.
 */
export default class PortfolioRails extends LightningElement {
  @api githubUrl;
  @api linkedinUrl;
  @api twitterUrl;
  @api instagramUrl;
  @api email;

  loaded = false;

  get socials() {
    const defs = [
      {
        id: "github",
        label: "GitHub",
        icon: "utility:socialshare",
        url: this.githubUrl
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        icon: "utility:company",
        url: this.linkedinUrl
      },
      {
        id: "twitter",
        label: "Twitter",
        icon: "utility:chat",
        url: this.twitterUrl
      },
      {
        id: "instagram",
        label: "Instagram",
        icon: "utility:photo",
        url: this.instagramUrl
      }
    ];
    return defs
      .filter((s) => s.url)
      .map((s, i) => ({ ...s, style: `--pf-delay: ${this.delayFor(i)}` }));
  }

  get mailto() {
    return this.email ? `mailto:${this.email}` : undefined;
  }

  delayFor(index) {
    return prefersReducedMotion() ? "0ms" : `${1000 + index * 100}ms`;
  }

  renderedCallback() {
    if (this.loaded) {
      return;
    }
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    requestAnimationFrame(() => {
      this.loaded = true;
    });
  }
}
