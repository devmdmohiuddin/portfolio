import { createElement } from "lwc";
import { registerApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import PortfolioHero from "c/portfolioHero";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";

const getConfigAdapter = registerApexTestWireAdapter(getConfig);

const CONFIG = {
  Full_Name__c: "Md Mohiuddin",
  Tagline__c: "I build things for the web.",
  Intro__c: "I'm a Salesforce developer who enjoys building things.",
  Email__c: "shuvobh1998@gmail.com"
};

// Reduced motion so the entrance resolves synchronously (no rAF timing).
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: query === "(prefers-reduced-motion: reduce)",
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

describe("c-portfolio-hero", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  function createComponent() {
    const element = createElement("c-portfolio-hero", { is: PortfolioHero });
    document.body.appendChild(element);
    return element;
  }

  it("renders name, tagline and intro from config", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const name = element.shadowRoot.querySelector(".pf-hero__name");
    const tagline = element.shadowRoot.querySelector(".pf-hero__tagline");
    const intro = element.shadowRoot.querySelector(".pf-hero__intro");

    expect(name.textContent).toBe(CONFIG.Full_Name__c);
    expect(tagline.textContent).toBe(CONFIG.Tagline__c);
    expect(intro.textContent).toBe(CONFIG.Intro__c);
  });

  it("wires the CTA to a mailto for the config email", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const cta = element.shadowRoot.querySelector(".pf-hero__cta");
    expect(cta.getAttribute("href")).toBe(`mailto:${CONFIG.Email__c}`);
  });

  it("hides the CTA when no email is configured", async () => {
    const element = createComponent();
    getConfigAdapter.emit({ Full_Name__c: "Someone" });
    await Promise.resolve();

    expect(element.shadowRoot.querySelector(".pf-hero__cta")).toBeNull();
  });

  it("always renders the greeting line", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const greeting = element.shadowRoot.querySelector(
      ".pf-hero__greeting-text"
    );
    expect(greeting.textContent).toBe("Hi, my name is.");
  });
});
