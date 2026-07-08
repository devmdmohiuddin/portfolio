import { createElement } from "lwc";
import { registerApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import PortfolioFooter from "c/portfolioFooter";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";

const getConfigAdapter = registerApexTestWireAdapter(getConfig);

const CONFIG = {
  Full_Name__c: "Md Mohiuddin",
  GitHub_URL__c: "https://github.com/devmdmohiuddin",
  LinkedIn_URL__c: "https://www.linkedin.com/in/themdmohiuddin/"
};

// Reduced motion so reveals + count-ups resolve synchronously.
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: query === "(prefers-reduced-motion: reduce)",
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

function mockFetchSuccess(stars, forks) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ stargazers_count: stars, forks_count: forks })
  });
}

function flushPromises() {
  // Drains the fetch → json → rerender microtask chain in the component.
  // eslint-disable-next-line @lwc/lwc/no-async-operation
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("c-portfolio-footer", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    delete global.fetch;
  });

  async function createComponent(props = {}, config = CONFIG) {
    const element = createElement("c-portfolio-footer", {
      is: PortfolioFooter
    });
    Object.assign(element, props);
    document.body.appendChild(element);
    getConfigAdapter.emit(config);
    await flushPromises();
    return element;
  }

  function statCounts(element) {
    return Array.from(
      element.shadowRoot.querySelectorAll(".pf-footer__stat-count")
    ).map((count) => count.textContent);
  }

  it("shows live star/fork counts from the GitHub API", async () => {
    mockFetchSuccess(42, 7);
    const element = await createComponent({ repoPath: "owner/repo" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo"
    );
    expect(statCounts(element)).toEqual(["42", "7"]);
  });

  it("falls back to static counts when the API call fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("blocked by CSP"));
    const element = await createComponent({
      repoPath: "owner/repo",
      fallbackStars: 5,
      fallbackForks: 2
    });

    expect(statCounts(element)).toEqual(["5", "2"]);
  });

  it("links the credit line to the repo and names the author", async () => {
    mockFetchSuccess(0, 0);
    const element = await createComponent({ repoPath: "owner/repo" });

    const credit = element.shadowRoot.querySelector(".pf-footer__credit");
    expect(credit.getAttribute("href")).toBe("https://github.com/owner/repo");
    expect(credit.textContent).toContain("Designed & Built by Md Mohiuddin");
  });

  it("hides the stats and skips the callout without a repo path", async () => {
    global.fetch = jest.fn();
    const element = await createComponent();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(element.shadowRoot.querySelector(".pf-footer__stats")).toBeNull();
    // Credit falls back to the config GitHub URL.
    expect(
      element.shadowRoot
        .querySelector(".pf-footer__credit")
        .getAttribute("href")
    ).toBe(CONFIG.GitHub_URL__c);
  });

  it("renders only the social links present in the config", async () => {
    mockFetchSuccess(0, 0);
    const element = await createComponent({ repoPath: "owner/repo" });

    const links = element.shadowRoot.querySelectorAll(
      ".pf-footer__social-link"
    );
    expect(
      Array.from(links).map((link) => link.getAttribute("aria-label"))
    ).toEqual(["GitHub", "LinkedIn"]);
  });

  it("marks the footer visible on reveal under reduced motion", async () => {
    mockFetchSuccess(0, 0);
    const element = await createComponent({ repoPath: "owner/repo" });

    const footer = element.shadowRoot.querySelector(".pf-footer");
    expect(footer.classList.contains("is-visible")).toBe(true);
  });
});
