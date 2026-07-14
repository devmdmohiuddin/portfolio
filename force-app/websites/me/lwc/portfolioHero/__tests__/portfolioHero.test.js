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

  it("renders name and intro from config", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const name = element.shadowRoot.querySelector(".pf-hero__name");
    const intro = element.shadowRoot.querySelector(".pf-hero__intro");

    expect(name.textContent).toBe(CONFIG.Full_Name__c);
    expect(intro.textContent).toBe(CONFIG.Intro__c);
  });

  it("renders the roles line, joined under reduced motion", async () => {
    const element = createComponent();
    getConfigAdapter.emit({
      ...CONFIG,
      Roles__c: "Software Engineer|DevOps Engineer|Consultant"
    });
    await Promise.resolve();

    const tagline = element.shadowRoot.querySelector(".pf-hero__tagline");
    expect(tagline.textContent).toBe(
      "Software Engineer · DevOps Engineer · Consultant"
    );
  });

  it("falls back to the tagline when no roles are set", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const tagline = element.shadowRoot.querySelector(".pf-hero__tagline");
    expect(tagline.textContent).toBe(CONFIG.Tagline__c);
  });

  it("opens the contact dialog when Get In Touch is clicked", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const dialog = element.shadowRoot.querySelector("c-contact-dialog");
    dialog.open = jest.fn();

    element.shadowRoot.querySelector(".pf-hero__cta").click();
    expect(dialog.open).toHaveBeenCalled();
  });

  it("always renders the greeting line", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const greeting = element.shadowRoot.querySelector(
      ".pf-hero__greeting-text"
    );
    expect(greeting.textContent).toBe("Hi, my name is");
  });
});
