import { createElement } from "lwc";
import { registerApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import PortfolioExperience from "c/portfolioExperience";
import getExperiences from "@salesforce/apex/PortfolioController.getExperiences";

const getExperiencesAdapter = registerApexTestWireAdapter(getExperiences);

const EXPERIENCES = [
  {
    Id: "a01000000000001",
    Name: "Salesforce",
    Role__c: "Senior Platform Developer",
    Company_URL__c: "https://www.salesforce.com",
    Start_Date__c: "2023-03-01",
    Is_Current__c: true,
    Sort_Order__c: 1,
    Highlights__c: "Built LWR sites.\nRaised Lighthouse scores.\n"
  },
  {
    Id: "a01000000000002",
    Name: "Acme Digital",
    Role__c: "Salesforce Developer",
    Company_URL__c: "https://example.com",
    Start_Date__c: "2021-01-15",
    End_Date__c: "2023-02-28",
    Is_Current__c: false,
    Sort_Order__c: 2,
    Highlights__c: "Delivered LWC components.\nIntegrated APIs."
  }
];

// Reduced motion so reveals resolve synchronously (no IntersectionObserver).
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: query === "(prefers-reduced-motion: reduce)",
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

describe("c-portfolio-experience", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  async function createComponent(records = EXPERIENCES) {
    const element = createElement("c-portfolio-experience", {
      is: PortfolioExperience
    });
    document.body.appendChild(element);
    getExperiencesAdapter.emit(records);
    await Promise.resolve();
    return element;
  }

  it("renders one tab per experience, in order", async () => {
    const element = await createComponent();

    const tabs = element.shadowRoot.querySelectorAll(".pf-exp__tab");
    expect(Array.from(tabs).map((tab) => tab.textContent.trim())).toEqual([
      "Salesforce",
      "Acme Digital"
    ]);
  });

  it("selects the first tab by default and shows its panel", async () => {
    const element = await createComponent();

    const tabs = element.shadowRoot.querySelectorAll(".pf-exp__tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].getAttribute("tabindex")).toBe("0");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(tabs[1].getAttribute("tabindex")).toBe("-1");

    const role = element.shadowRoot.querySelector(".pf-exp__role");
    expect(role.textContent).toContain("Senior Platform Developer");
    const range = element.shadowRoot.querySelector(".pf-exp__range");
    expect(range.textContent).toBe("Mar 2023 — Present");
    const highlights =
      element.shadowRoot.querySelectorAll(".pf-exp__highlight");
    expect(highlights).toHaveLength(2);
    expect(highlights[0].textContent).toBe("Built LWR sites.");
  });

  it("links the company name to Company_URL__c", async () => {
    const element = await createComponent();

    const link = element.shadowRoot.querySelector(".pf-exp__company-link");
    expect(link.getAttribute("href")).toBe("https://www.salesforce.com");
    expect(link.textContent).toBe("Salesforce");
  });

  it("swaps the panel and slides the indicator on tab click", async () => {
    const element = await createComponent();

    const tabs = element.shadowRoot.querySelectorAll(".pf-exp__tab");
    tabs[1].click();
    await Promise.resolve();

    const updated = element.shadowRoot.querySelectorAll(".pf-exp__tab");
    expect(updated[1].getAttribute("aria-selected")).toBe("true");
    expect(updated[0].getAttribute("aria-selected")).toBe("false");

    const role = element.shadowRoot.querySelector(".pf-exp__role");
    expect(role.textContent).toContain("Salesforce Developer");
    const range = element.shadowRoot.querySelector(".pf-exp__range");
    expect(range.textContent).toBe("Jan 2021 — Feb 2023");

    const tablist = element.shadowRoot.querySelector(".pf-exp__tablist");
    expect(tablist.getAttribute("style")).toContain("--pf-active-index: 1");
  });

  it("moves the selection with arrow, Home and End keys", async () => {
    const element = await createComponent();
    const tablist = element.shadowRoot.querySelector(".pf-exp__tablist");

    const press = async (key) => {
      tablist.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true })
      );
      await Promise.resolve();
    };

    await press("ArrowDown");
    let tabs = element.shadowRoot.querySelectorAll(".pf-exp__tab");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");

    // Wraps from the last tab back to the first.
    await press("ArrowDown");
    tabs = element.shadowRoot.querySelectorAll(".pf-exp__tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");

    await press("End");
    tabs = element.shadowRoot.querySelectorAll(".pf-exp__tab");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");

    await press("Home");
    tabs = element.shadowRoot.querySelectorAll(".pf-exp__tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("renders nothing inside the section when there are no records", async () => {
    const element = await createComponent([]);

    expect(element.shadowRoot.querySelector(".pf-exp")).toBeNull();
  });

  it("marks the block visible immediately under reduced motion", async () => {
    const element = await createComponent();
    // One extra microtask: reveal classes are applied in renderedCallback.
    await Promise.resolve();

    const block = element.shadowRoot.querySelector(".pf-exp");
    expect(block.classList.contains("is-visible")).toBe(true);
  });
});
