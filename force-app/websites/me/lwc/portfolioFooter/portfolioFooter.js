import { LightningElement, api, wire } from "lwc";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";
import { revealOnScroll, prefersReducedMotion } from "c/portfolioMotion";

const COUNT_UP_MS = 1200;

/**
 * portfolioFooter — "Designed & Built" credit, social links, repo stats.
 *
 * The credit line links to the site's own GitHub repo and shows its live
 * star/fork counts, fetched client-side from the GitHub API. When the
 * callout is unavailable (CSP, rate limit, offline) the counts fall back
 * to the static `fallback-*` values so the footer never breaks. Social
 * links and the author name come from Portfolio_Config__mdt; the social
 * row only shows on narrow screens where the side rails are hidden.
 *
 * Motion: the footer fades up on scroll and the star/fork counts count
 * up from zero on reveal — instantly under `prefers-reduced-motion`.
 */
export default class PortfolioFooter extends LightningElement {
  /** "owner/repo" used for the credit link and the GitHub stats call. */
  @api repoPath;
  /** Static counts used when the GitHub API can't be reached. */
  @api fallbackStars = 0;
  @api fallbackForks = 0;

  name;
  githubUrl;
  linkedinUrl;
  twitterUrl;
  instagramUrl;
  starsDisplay = 0;
  forksDisplay = 0;

  _stars;
  _forks;
  _revealed = false;
  _counted = false;
  _observed = false;
  _disconnect;

  @wire(getConfig)
  wiredConfig({ data }) {
    if (data) {
      this.name = data.Full_Name__c;
      this.githubUrl = data.GitHub_URL__c;
      this.linkedinUrl = data.LinkedIn_URL__c;
      this.twitterUrl = data.Twitter_URL__c;
      this.instagramUrl = data.Instagram_URL__c;
    }
  }

  connectedCallback() {
    this.loadStats();
  }

  get socials() {
    return [
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
    ].filter((s) => s.url);
  }

  get creditText() {
    return this.name ? `Designed & Built by ${this.name}` : "Designed & Built";
  }

  get creditUrl() {
    return this.repoPath
      ? `https://github.com/${this.repoPath}`
      : this.githubUrl;
  }

  get showStats() {
    return Boolean(this.repoPath);
  }

  /**
   * Live star/fork counts for the repo; the static fallbacks apply when
   * the API is unreachable so the stats row always renders.
   */
  async loadStats() {
    if (this.showStats && typeof fetch === "function") {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${this.repoPath}`
        );
        if (response.ok) {
          const repo = await response.json();
          this.setTargets(repo.stargazers_count, repo.forks_count);
          return;
        }
      } catch {
        // CSP or network failure — fall through to the static counts.
      }
    }
    this.setTargets(this.fallbackStars, this.fallbackForks);
  }

  setTargets(stars, forks) {
    this._stars = Number(stars) || 0;
    this._forks = Number(forks) || 0;
    this.maybeCountUp();
  }

  renderedCallback() {
    if (this._observed) {
      return;
    }
    this._observed = true;
    const footer = this.template.querySelector(".pf-footer");
    this._disconnect = revealOnScroll(footer ? [footer] : [], {
      onReveal: () => {
        this._revealed = true;
        this.maybeCountUp();
      }
    });
  }

  /** Start counting once the footer is on screen and the stats resolved. */
  maybeCountUp() {
    if (this._counted || !this._revealed || this._stars === undefined) {
      return;
    }
    this._counted = true;
    if (
      prefersReducedMotion() ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      this.starsDisplay = this._stars;
      this.forksDisplay = this._forks;
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / COUNT_UP_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.starsDisplay = Math.round(this._stars * eased);
      this.forksDisplay = Math.round(this._forks * eased);
      if (t < 1) {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        window.requestAnimationFrame(tick);
      }
    };
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    window.requestAnimationFrame(tick);
  }

  disconnectedCallback() {
    if (this._disconnect) {
      this._disconnect();
    }
  }
}
