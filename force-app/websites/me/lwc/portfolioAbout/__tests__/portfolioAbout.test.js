import { createElement } from "lwc";
import { registerApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import PortfolioAbout from "c/portfolioAbout";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";

const getConfigAdapter = registerApexTestWireAdapter(getConfig);

const CONFIG = {
  Full_Name__c: "Md Mohiuddin",
  About__c: "First paragraph about me.\n\nSecond paragraph, more detail.",
  Tech_List__c: "Apex\nLightning Web Components\n\nJavaScript (ES6+)\n",
  Photo_URL__c: "https://example.com/resource/portfolioPhoto"
};

// Reduced motion so reveals resolve synchronously (no IntersectionObserver).
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: query === "(prefers-reduced-motion: reduce)",
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

describe("c-portfolio-about", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  function createComponent() {
    const element = createElement("c-portfolio-about", { is: PortfolioAbout });
    document.body.appendChild(element);
    return element;
  }

  it("renders one paragraph per blank-line block of About__c", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const paras = element.shadowRoot.querySelectorAll(".pf-about__para");
    expect(paras).toHaveLength(2);
    expect(paras[0].textContent).toBe("First paragraph about me.");
    expect(paras[1].textContent).toBe("Second paragraph, more detail.");
  });

  it("renders a tech item per non-empty Tech_List__c line", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const items = element.shadowRoot.querySelectorAll(".pf-about__tech-item");
    expect(Array.from(items).map((li) => li.textContent.trim())).toEqual([
      "Apex",
      "Lightning Web Components",
      "JavaScript (ES6+)"
    ]);
  });

  it("renders the photo with the config URL and a named alt text", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();

    const img = element.shadowRoot.querySelector(".pf-about__img");
    expect(img.getAttribute("src")).toBe(CONFIG.Photo_URL__c);
    expect(img.getAttribute("alt")).toBe("Portrait of Md Mohiuddin");
  });

  it("hides photo and tech list when not configured", async () => {
    const element = createComponent();
    getConfigAdapter.emit({ About__c: "Just some copy." });
    await Promise.resolve();

    expect(element.shadowRoot.querySelector(".pf-about__img")).toBeNull();
    expect(element.shadowRoot.querySelector(".pf-about__tech")).toBeNull();
    expect(element.shadowRoot.querySelectorAll(".pf-about__para")).toHaveLength(
      1
    );
  });

  it("marks reveal targets visible immediately under reduced motion", async () => {
    const element = createComponent();
    getConfigAdapter.emit(CONFIG);
    await Promise.resolve();
    // One extra microtask: reveal classes are applied in renderedCallback.
    await Promise.resolve();

    const text = element.shadowRoot.querySelector(".pf-about__text");
    expect(text.classList.contains("is-visible")).toBe(true);
  });
});
