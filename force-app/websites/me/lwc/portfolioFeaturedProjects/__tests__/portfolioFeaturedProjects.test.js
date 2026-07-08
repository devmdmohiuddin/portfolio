import { createElement } from "lwc";
import { registerApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import PortfolioFeaturedProjects from "c/portfolioFeaturedProjects";
import getProjects from "@salesforce/apex/PortfolioController.getProjects";

const getProjectsAdapter = registerApexTestWireAdapter(getProjects);

const PROJECTS = [
  {
    Id: "a02000000000001",
    Name: "Portfolio Experience Site",
    Description__c: "A fully data-driven portfolio on Experience Cloud.",
    Type__c: "Featured",
    Sort_Order__c: 1,
    GitHub_URL__c: "https://github.com/devmdmohiuddin",
    External_URL__c: "https://example.com/portfolio",
    Image_URL__c: "https://example.com/portfolio.png",
    Is_Published__c: true,
    Project_Techs__r: [
      { Id: "a03000000000001", Name: "Apex" },
      { Id: "a03000000000002", Name: "LWC" }
    ]
  },
  {
    Id: "a02000000000002",
    Name: "Motion Toolkit for LWC",
    Description__c: "A reusable scroll-reveal toolkit.",
    Type__c: "Featured",
    Sort_Order__c: 2,
    GitHub_URL__c: "https://github.com/devmdmohiuddin/motion",
    Is_Published__c: true
  }
];

// Reduced motion so reveals resolve synchronously (no IntersectionObserver).
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: query === "(prefers-reduced-motion: reduce)",
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

describe("c-portfolio-featured-projects", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  async function createComponent(records = PROJECTS) {
    const element = createElement("c-portfolio-featured-projects", {
      is: PortfolioFeaturedProjects
    });
    document.body.appendChild(element);
    getProjectsAdapter.emit(records);
    await Promise.resolve();
    return element;
  }

  it("renders one card per featured project, in order", async () => {
    const element = await createComponent();

    const titles = element.shadowRoot.querySelectorAll(".pf-proj__title");
    expect(Array.from(titles).map((t) => t.textContent.trim())).toEqual([
      "Portfolio Experience Site",
      "Motion Toolkit for LWC"
    ]);
  });

  it("alternates the layout with the reverse modifier on odd cards", async () => {
    const element = await createComponent();

    const cards = element.shadowRoot.querySelectorAll(".pf-proj");
    expect(cards[0].classList.contains("pf-proj--reverse")).toBe(false);
    expect(cards[1].classList.contains("pf-proj--reverse")).toBe(true);
  });

  it("links the title and image to the external URL, falling back to GitHub", async () => {
    const element = await createComponent();

    const titleLinks = element.shadowRoot.querySelectorAll(
      ".pf-proj__title-link"
    );
    // First card prefers External_URL__c; second falls back to GitHub_URL__c.
    expect(titleLinks[0].getAttribute("href")).toBe(
      "https://example.com/portfolio"
    );
    expect(titleLinks[1].getAttribute("href")).toBe(
      "https://github.com/devmdmohiuddin/motion"
    );

    const imageLink = element.shadowRoot.querySelector("a.pf-proj__image-link");
    expect(imageLink.getAttribute("href")).toBe(
      "https://example.com/portfolio"
    );
  });

  it("renders the project image with alt text, and a fallback panel without one", async () => {
    const element = await createComponent();

    const image = element.shadowRoot.querySelector(".pf-proj__image");
    expect(image.getAttribute("src")).toBe("https://example.com/portfolio.png");
    expect(image.getAttribute("alt")).toBe(
      "Screenshot of Portfolio Experience Site"
    );

    const fallback = element.shadowRoot.querySelector(
      ".pf-proj__image-fallback"
    );
    expect(fallback.textContent).toContain("Motion Toolkit for LWC");
  });

  it("renders tech tags and GitHub/external icon links", async () => {
    const element = await createComponent();

    const tags = element.shadowRoot.querySelectorAll(".pf-proj__tech-item");
    expect(Array.from(tags).map((t) => t.textContent)).toEqual(["Apex", "LWC"]);

    const firstCardLinks = element.shadowRoot.querySelectorAll(
      ".pf-proj:first-child .pf-proj__link"
    );
    expect(firstCardLinks).toHaveLength(2);
    expect(firstCardLinks[0].getAttribute("href")).toBe(
      "https://github.com/devmdmohiuddin"
    );
    expect(firstCardLinks[1].getAttribute("href")).toBe(
      "https://example.com/portfolio"
    );
  });

  it("renders nothing inside the section when there are no records", async () => {
    const element = await createComponent([]);

    expect(element.shadowRoot.querySelector(".pf-projects")).toBeNull();
  });

  it("marks the cards visible immediately under reduced motion", async () => {
    const element = await createComponent();
    // One extra microtask: reveal classes are applied in renderedCallback.
    await Promise.resolve();

    const cards = element.shadowRoot.querySelectorAll(".pf-proj");
    cards.forEach((card) => {
      expect(card.classList.contains("is-visible")).toBe(true);
    });
  });
});
