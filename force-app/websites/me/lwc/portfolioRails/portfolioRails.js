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
  @api trailheadUrl;
  @api linkedinUrl;
  @api twitterUrl;
  @api facebookUrl;
  // Retained (unused) so the published component's property can't be "removed",
  // which the platform blocks while it's referenced in a live instance.
  @api instagramUrl;
  @api email;

  loaded = false;

  get socials() {
    const defs = [
      { id: "github", label: "GitHub", url: this.githubUrl },
      { id: "trailhead", label: "Trailhead", url: this.trailheadUrl },
      { id: "linkedin", label: "LinkedIn", url: this.linkedinUrl },
      { id: "twitter", label: "Twitter", url: this.twitterUrl },
      { id: "facebook", label: "Facebook", url: this.facebookUrl }
    ];
    return defs
      .filter((s) => s.url)
      .map((s, i) => ({
        ...s,
        isGithub: s.id === "github",
        isTrailhead: s.id === "trailhead",
        isLinkedin: s.id === "linkedin",
        isTwitter: s.id === "twitter",
        isFacebook: s.id === "facebook",
        style: `--pf-delay: ${this.delayFor(i)}`
      }));
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
