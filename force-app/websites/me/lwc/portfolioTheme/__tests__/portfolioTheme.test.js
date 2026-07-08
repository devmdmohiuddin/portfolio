import { createElement } from "lwc";
import PortfolioTheme from "c/portfolioTheme";

describe("c-portfolio-theme", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    const injected = document.head.querySelector("#pf-global-tokens");
    if (injected) {
      injected.remove();
    }
  });

  it("injects the global design tokens into the document head", () => {
    const element = createElement("c-portfolio-theme", { is: PortfolioTheme });
    document.body.appendChild(element);

    const style = document.head.querySelector("#pf-global-tokens");
    expect(style).not.toBeNull();
    expect(style.tagName).toBe("STYLE");
    expect(style.textContent).toContain("--pf-bg: #0a192f");
    expect(style.textContent).toContain('[data-theme="light"]');
  });

  it("renders nothing visible", () => {
    const element = createElement("c-portfolio-theme", { is: PortfolioTheme });
    document.body.appendChild(element);
    expect(element.shadowRoot.textContent).toBe("");
  });
});
