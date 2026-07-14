import { createElement } from "lwc";
import { registerApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import PortfolioContact from "c/portfolioContact";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";

const getConfigAdapter = registerApexTestWireAdapter(getConfig);

const CONFIG = {
  Email__c: "shuvobh1998@gmail.com",
  Availability_Message__c: "I'm currently open to new opportunities."
};

// Reduced motion so reveals resolve synchronously (no IntersectionObserver).
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: query === "(prefers-reduced-motion: reduce)",
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

describe("c-portfolio-contact", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  async function createComponent(config = CONFIG) {
    const element = createElement("c-portfolio-contact", {
      is: PortfolioContact
    });
    document.body.appendChild(element);
    getConfigAdapter.emit(config);
    await Promise.resolve();
    return element;
  }

  it("renders the overline, heading, and availability message", async () => {
    const element = await createComponent();

    expect(
      element.shadowRoot.querySelector(".pf-contact__overline").textContent
    ).toContain("What’s Next?");
    expect(
      element.shadowRoot.querySelector(".pf-contact__title").textContent
    ).toBe("Get In Touch");
    expect(
      element.shadowRoot.querySelector(".pf-contact__message").textContent
    ).toBe(CONFIG.Availability_Message__c);
  });

  it("opens the contact dialog when Say Hello is clicked", async () => {
    const element = await createComponent();

    const cta = element.shadowRoot.querySelector(".pf-contact__cta");
    expect(cta.textContent.trim()).toBe("Say Hello");

    const dialog = element.shadowRoot.querySelector("c-contact-dialog");
    dialog.open = jest.fn();
    cta.click();
    expect(dialog.open).toHaveBeenCalled();
  });

  it("hides the message when the config omits it but keeps the CTA", async () => {
    const element = await createComponent({});

    // The Say Hello button is always available now (opens the dialog).
    expect(element.shadowRoot.querySelector(".pf-contact__cta")).not.toBeNull();
    expect(element.shadowRoot.querySelector(".pf-contact__message")).toBeNull();
    // Static copy still renders.
    expect(
      element.shadowRoot.querySelector(".pf-contact__title")
    ).not.toBeNull();
  });

  it("marks content visible on reveal under reduced motion", async () => {
    const element = await createComponent();
    // Reveal classes are applied in renderedCallback after config loads.
    await Promise.resolve();

    const items = element.shadowRoot.querySelectorAll("[data-reveal]");
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect(item.classList.contains("is-visible")).toBe(true);
    });
  });
});
