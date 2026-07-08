import { LightningElement, wire } from "lwc";
import getProjects from "@salesforce/apex/PortfolioController.getProjects";
import { revealOnScroll } from "c/portfolioMotion";

/**
 * portfolioFeaturedProjects — the "03. Some Things I've Built" section.
 *
 * Large alternating project cards driven by Project__c records where
 * Type__c = Featured: image on one side, overlapping description panel on
 * the other, with tech tags and GitHub / external links. Adding a card is
 * just creating a record — order comes from Sort_Order__c.
 *
 * Motion: cards slide in from alternating sides on scroll (the reveal
 * direction follows the card's layout side) and the image lifts/scales
 * with its accent overlay clearing on hover. Everything collapses to
 * static under `prefers-reduced-motion`.
 */
export default class PortfolioFeaturedProjects extends LightningElement {
  projects = [];
  error;

  _disconnect;
  _observed = false;

  @wire(getProjects, { type: "Featured" })
  wiredProjects({ data, error }) {
    if (data) {
      this.projects = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.projects = [];
    }
  }

  get hasProjects() {
    return this.projects.length > 0;
  }

  /** View models with the alternating layout + link wiring each card needs. */
  get cards() {
    return this.projects.map((project, index) => {
      const reverse = index % 2 === 1;
      const primaryUrl = project.External_URL__c || project.GitHub_URL__c;
      return {
        id: project.Id,
        title: project.Name,
        titleUrl: primaryUrl,
        description: project.Description__c,
        githubUrl: project.GitHub_URL__c,
        externalUrl: project.External_URL__c,
        imageUrl: project.Image_URL__c,
        imageAlt: `Screenshot of ${project.Name}`,
        githubLabel: `${project.Name} on GitHub`,
        externalLabel: `Visit ${project.Name}`,
        tech: (project.Project_Techs__r || []).map((tag) => ({
          id: tag.Id,
          name: tag.Name
        })),
        hasTech: (project.Project_Techs__r || []).length > 0,
        cssClass: reverse ? "pf-proj pf-proj--reverse" : "pf-proj"
      };
    });
  }

  renderedCallback() {
    if (this._observed || !this.hasProjects) {
      return;
    }
    this._observed = true;
    this._disconnect = revealOnScroll(
      this.template.querySelectorAll("[data-reveal]")
    );
  }

  disconnectedCallback() {
    if (this._disconnect) {
      this._disconnect();
    }
  }
}
