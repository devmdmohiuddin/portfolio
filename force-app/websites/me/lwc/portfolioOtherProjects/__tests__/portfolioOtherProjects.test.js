import { createElement } from "lwc";
import { registerApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import PortfolioOtherProjects from "c/portfolioOtherProjects";
import getProjects from "@salesforce/apex/PortfolioController.getProjects";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";

const getProjectsAdapter = registerApexTestWireAdapter(getProjects);
const getConfigAdapter = registerApexTestWireAdapter(getConfig);

const CONFIG = { GitHub_URL__c: "https://github.com/devmdmohiuddin" };

const PROJECTS = [
  {
    Id: "a02000000000001",
    Name: "Apex Data Seeder",
    Description__c: "Idempotent anonymous-Apex utilities for seeding orgs.",
    Type__c: "Other",
    Sort_Order__c: 1,
    GitHub_URL__c: "https://github.com/devmdmohiuddin/seeder",
    Is_Published__c: true,
    Show_In_Archive__c: false,
    Project_Techs__r: [{ Id: "a03000000000001", Name: "Apex" }]
  },
  {
    Id: "a02000000000002",
    Name: "Design Token System",
    Description__c: "CSS custom-property design tokens.",
    Type__c: "Other",
    Sort_Order__c: 2,
    External_URL__c: "https://example.com/design-tokens",
    Is_Published__c: true,
    Show_In_Archive__c: false
  },
  {
    Id: "a02000000000003",
    Name: "Legacy VF Dashboard",
    Description__c: "An early Visualforce reporting dashboard.",
    Type__c: "Other",
    Sort_Order__c: 3,
    Is_Published__c: true,
    Show_In_Archive__c: true
  },
  {
    Id: "a02000000000004",
    Name: "Trigger Framework Demo",
    Description__c: "A lightweight Apex trigger handler pattern.",
    Type__c: "Other",
    Sort_Order__c: 4,
    GitHub_URL__c: "https://github.com/devmdmohiuddin/triggers",
    Is_Published__c: true,
    Show_In_Archive__c: true
  }
];

// Reduced motion so reveals resolve synchronously (no IntersectionObserver).
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: query === "(prefers-reduced-motion: reduce)",
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

describe("c-portfolio-other-projects", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  async function createComponent(records = PROJECTS, config = CONFIG) {
    const element = createElement("c-portfolio-other-projects", {
      is: PortfolioOtherProjects
    });
    document.body.appendChild(element);
    getProjectsAdapter.emit(records);
    getConfigAdapter.emit(config);
    await Promise.resolve();
    return element;
  }

  function cardTitles(element) {
    return Array.from(
      element.shadowRoot.querySelectorAll(".pf-card__title")
    ).map((t) => t.textContent.trim());
  }

  it("renders only non-archived cards initially, in order", async () => {
    const element = await createComponent();

    expect(cardTitles(element)).toEqual([
      "Apex Data Seeder",
      "Design Token System"
    ]);
  });

  it("reveals archived cards on Show More and collapses on Show Less", async () => {
    const element = await createComponent();

    const button = element.shadowRoot.querySelector(".pf-other__more");
    expect(button.textContent.trim()).toBe("Show More");
    expect(button.getAttribute("aria-expanded")).toBe("false");

    button.click();
    await Promise.resolve();

    expect(cardTitles(element)).toEqual([
      "Apex Data Seeder",
      "Design Token System",
      "Legacy VF Dashboard",
      "Trigger Framework Demo"
    ]);
    expect(button.textContent.trim()).toBe("Show Less");
    expect(button.getAttribute("aria-expanded")).toBe("true");

    button.click();
    await Promise.resolve();

    expect(cardTitles(element)).toHaveLength(2);
    expect(button.textContent.trim()).toBe("Show More");
  });

  it("marks archive cards visible after Show More under reduced motion", async () => {
    const element = await createComponent();

    element.shadowRoot.querySelector(".pf-other__more").click();
    await Promise.resolve();
    // One extra microtask: reveal classes are applied in renderedCallback.
    await Promise.resolve();

    const cards = element.shadowRoot.querySelectorAll(".pf-card");
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      expect(card.classList.contains("is-visible")).toBe(true);
    });
  });

  it("hides the Show More button when no records are archived", async () => {
    const element = await createComponent(
      PROJECTS.filter((p) => !p.Show_In_Archive__c)
    );

    expect(element.shadowRoot.querySelector(".pf-other__more")).toBeNull();
  });

  it("links the title to the external URL, falling back to GitHub", async () => {
    const element = await createComponent();

    const titleLinks = element.shadowRoot.querySelectorAll(
      ".pf-card__title-link"
    );
    // First card only has GitHub; second prefers External_URL__c.
    expect(titleLinks[0].getAttribute("href")).toBe(
      "https://github.com/devmdmohiuddin/seeder"
    );
    expect(titleLinks[1].getAttribute("href")).toBe(
      "https://example.com/design-tokens"
    );
  });

  it("renders tech tags and header icon links", async () => {
    const element = await createComponent();

    const tags = element.shadowRoot.querySelectorAll(".pf-card__tech-item");
    expect(Array.from(tags).map((t) => t.textContent)).toEqual(["Apex"]);

    const firstCardLink = element.shadowRoot.querySelector(
      ".pf-card .pf-card__link"
    );
    expect(firstCardLink.getAttribute("href")).toBe(
      "https://github.com/devmdmohiuddin/seeder"
    );
  });

  it("renders the archive link from the config GitHub URL", async () => {
    const element = await createComponent();

    const archiveLink = element.shadowRoot.querySelector(
      ".pf-other__archive-link"
    );
    expect(archiveLink.getAttribute("href")).toBe(
      "https://github.com/devmdmohiuddin"
    );
  });

  it("omits the archive link when the config has no GitHub URL", async () => {
    const element = await createComponent(PROJECTS, {});

    expect(
      element.shadowRoot.querySelector(".pf-other__archive-link")
    ).toBeNull();
  });

  it("shows the empty state when there are no records", async () => {
    const element = await createComponent([]);

    expect(element.shadowRoot.querySelector(".pf-other__grid")).toBeNull();
    expect(
      element.shadowRoot.querySelector(".pf-other__empty").textContent
    ).toContain("More projects coming soon");
  });
});
