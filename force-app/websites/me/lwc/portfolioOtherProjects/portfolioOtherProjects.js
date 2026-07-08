import { LightningElement, wire } from "lwc";
import getProjects from "@salesforce/apex/PortfolioController.getProjects";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";
import {
  revealOnScroll,
  stagger,
  prefersReducedMotion
} from "c/portfolioMotion";

/**
 * portfolioOtherProjects — the "Other Noteworthy Projects" grid.
 *
 * Compact folder-icon cards driven by Project__c records where
 * Type__c = Other. Records flagged Show_In_Archive__c stay hidden until
 * the visitor clicks "Show More"; the "view the archive" link (from the
 * config GitHub URL) points at the full body of work.
 *
 * Motion: cards stagger in on scroll, hover lifts a card and colors its
 * folder/title, and cards revealed by "Show More" cascade in as they
 * mount. Everything collapses to static under `prefers-reduced-motion`.
 */
export default class PortfolioOtherProjects extends LightningElement {
  projects = [];
  error;
  loaded = false;
  showArchive = false;
  archiveUrl;

  _disconnect;
  _observed = false;
  _pendingArchiveReveal = false;

  @wire(getProjects, { type: "Other" })
  wiredProjects({ data, error }) {
    if (data) {
      this.projects = data;
      this.error = undefined;
      this.loaded = true;
    } else if (error) {
      this.error = error;
      this.projects = [];
      this.loaded = true;
    }
  }

  @wire(getConfig)
  wiredConfig({ data }) {
    if (data) {
      this.archiveUrl = data.GitHub_URL__c;
    }
  }

  get hasProjects() {
    return this.projects.length > 0;
  }

  get showEmpty() {
    return this.loaded && !this.hasProjects;
  }

  /** True when at least one record is held back for "Show More". */
  get hasArchive() {
    return this.projects.some((project) => project.Show_In_Archive__c);
  }

  get toggleLabel() {
    return this.showArchive ? "Show Less" : "Show More";
  }

  get archiveExpanded() {
    return String(this.showArchive);
  }

  /** View models for the visible cards: current grid + expanded archive. */
  get cards() {
    return this.projects
      .filter((project) => this.showArchive || !project.Show_In_Archive__c)
      .map((project) => {
        const primaryUrl = project.External_URL__c || project.GitHub_URL__c;
        return {
          id: project.Id,
          title: project.Name,
          titleUrl: primaryUrl,
          description: project.Description__c,
          githubUrl: project.GitHub_URL__c,
          externalUrl: project.External_URL__c,
          githubLabel: `${project.Name} on GitHub`,
          externalLabel: `Visit ${project.Name}`,
          tech: (project.Project_Techs__r || []).map((tag) => ({
            id: tag.Id,
            name: tag.Name
          })),
          hasTech: (project.Project_Techs__r || []).length > 0
        };
      });
  }

  handleToggleArchive() {
    this.showArchive = !this.showArchive;
    if (this.showArchive) {
      this._pendingArchiveReveal = true;
    }
  }

  renderedCallback() {
    if (!this._observed && this.hasProjects) {
      this._observed = true;
      const cards = this.template.querySelectorAll("[data-reveal]");
      stagger(cards);
      this._disconnect = revealOnScroll(cards);
    }
    if (this._pendingArchiveReveal) {
      this._pendingArchiveReveal = false;
      this.revealArchiveCards();
    }
  }

  /**
   * Cascade in the cards that "Show More" just mounted. They are already
   * on screen (the button sits below the grid), so instead of observing
   * them we stagger their delays and flip them visible on the next frame.
   */
  revealArchiveCards() {
    const fresh = Array.from(
      this.template.querySelectorAll("[data-reveal]:not(.is-visible)")
    );
    if (fresh.length === 0) {
      return;
    }
    stagger(fresh);
    if (
      prefersReducedMotion() ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      fresh.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    // Double rAF so the hidden start state paints before the transition.
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    window.requestAnimationFrame(() => {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      window.requestAnimationFrame(() => {
        fresh.forEach((el) => el.classList.add("is-visible"));
      });
    });
  }

  disconnectedCallback() {
    if (this._disconnect) {
      this._disconnect();
    }
  }
}
