import { createElement } from "lwc";
import ThemeToggle from "c/themeToggle";

function mockMatchMedia(prefersLight) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: query === "(prefers-color-scheme: light)" ? prefersLight : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));
}

describe("c-theme-toggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    mockMatchMedia(false);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  function createComponent() {
    const element = createElement("c-theme-toggle", { is: ThemeToggle });
    document.body.appendChild(element);
    return element;
  }

  it("defaults to dark and sets data-theme on the document root", () => {
    createComponent();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("honors a stored light preference on load", () => {
    window.localStorage.setItem("pf-theme", "light");
    const element = createComponent();

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    const button = element.shadowRoot.querySelector(".pf-theme-toggle");
    expect(button.classList.contains("pf-theme-toggle--light")).toBe(true);
  });

  it("follows prefers-color-scheme when no preference is stored", () => {
    mockMatchMedia(true);
    createComponent();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("toggles theme, persists it and updates the root attribute", async () => {
    const element = createComponent();
    const button = element.shadowRoot.querySelector(".pf-theme-toggle");

    button.click();
    await Promise.resolve();

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem("pf-theme")).toBe("light");

    button.click();
    await Promise.resolve();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem("pf-theme")).toBe("dark");
  });

  it("exposes an accessible label describing the next theme", () => {
    const element = createComponent();
    const button = element.shadowRoot.querySelector(".pf-theme-toggle");
    expect(button.getAttribute("aria-label")).toBe("Switch to light theme");
  });
});
