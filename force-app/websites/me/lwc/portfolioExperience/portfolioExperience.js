import { LightningElement, wire } from "lwc";
import getExperiences from "@salesforce/apex/PortfolioController.getExperiences";
import { revealOnScroll } from "c/portfolioMotion";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/**
 * portfolioExperience — the "02. Where I've Worked" section.
 *
 * A vertical tab list of companies (horizontal on mobile) with a panel
 * showing the role, date range and bulleted highlights of the selected
 * Experience__c record. Records come pre-ordered from
 * PortfolioController.getExperiences — adding a company is just creating
 * a record.
 *
 * Accessibility: WAI-ARIA tabs with roving tabindex, `aria-selected`,
 * and arrow/Home/End key navigation.
 *
 * Motion: the active-tab indicator slides between tabs (driven by the
 * `--pf-active-index` custom property), the panel content fades/slides in
 * on tab change, and the whole block reveals on scroll. Everything
 * collapses to static under `prefers-reduced-motion`.
 */
export default class PortfolioExperience extends LightningElement {
  experiences = [];
  error;
  activeIndex = 0;

  _disconnect;
  _observed = false;

  @wire(getExperiences)
  wiredExperiences({ data, error }) {
    if (data) {
      this.experiences = data;
      this.error = undefined;
      if (this.activeIndex >= data.length) {
        this.activeIndex = 0;
      }
    } else if (error) {
      this.error = error;
      this.experiences = [];
    }
  }

  get hasExperiences() {
    return this.experiences.length > 0;
  }

  /** Tabs with the ARIA wiring each button needs. */
  get tabs() {
    return this.experiences.map((exp, index) => {
      const selected = index === this.activeIndex;
      return {
        id: exp.Id,
        index,
        label: exp.Name,
        tabId: `tab-${index}`,
        panelId: `panel-${index}`,
        selected: String(selected),
        tabindex: selected ? 0 : -1,
        cssClass: selected ? "pf-exp__tab pf-exp__tab--active" : "pf-exp__tab"
      };
    });
  }

  /**
   * Single-item list so the panel DOM is recreated (keyed by record Id)
   * on tab change, replaying the CSS entrance animation.
   */
  get activePanel() {
    const exp = this.experiences[this.activeIndex];
    if (!exp) {
      return [];
    }
    return [
      {
        id: exp.Id,
        role: exp.Role__c,
        company: exp.Name,
        companyUrl: exp.Company_URL__c,
        dateRange: this.formatRange(exp),
        highlights: (exp.Highlights__c || "")
          .split("\n")
          .map((text) => text.trim())
          .filter(Boolean)
          .map((text, i) => ({ id: `hl-${i}`, text }))
      }
    ];
  }

  get activeTabId() {
    return `tab-${this.activeIndex}`;
  }

  get activePanelId() {
    return `panel-${this.activeIndex}`;
  }

  /** Slides the indicator: CSS keys off --pf-active-index. */
  get tablistStyle() {
    return `--pf-active-index: ${this.activeIndex}`;
  }

  /** "Mar 2023 — Present" from the record's date fields. */
  formatRange(exp) {
    const start = this.formatMonth(exp.Start_Date__c);
    const end = exp.Is_Current__c
      ? "Present"
      : this.formatMonth(exp.End_Date__c);
    if (!start && !end) {
      return "";
    }
    return `${start || ""} — ${end || ""}`;
  }

  /** "2023-03-01" → "Mar 2023" (parsed by parts to stay timezone-safe). */
  formatMonth(isoDate) {
    if (!isoDate) {
      return "";
    }
    const [year, month] = isoDate.split("-");
    const name = MONTHS[parseInt(month, 10) - 1];
    return name ? `${name} ${year}` : "";
  }

  handleTabClick(event) {
    this.selectTab(parseInt(event.currentTarget.dataset.index, 10));
  }

  handleTabKeydown(event) {
    const count = this.experiences.length;
    if (count === 0) {
      return;
    }
    let next = null;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = (this.activeIndex + 1) % count;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = (this.activeIndex - 1 + count) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.selectTab(next, true);
  }

  selectTab(index, focus = false) {
    if (index === this.activeIndex || Number.isNaN(index)) {
      return;
    }
    this.activeIndex = index;
    if (focus) {
      // Roving tabindex: move keyboard focus to the newly active tab
      // once it re-renders with tabindex="0".
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      requestAnimationFrame(() => {
        const tab = this.template.querySelector(`[data-index="${index}"]`);
        if (tab) {
          tab.focus();
        }
      });
    }
  }

  renderedCallback() {
    if (this._observed || !this.hasExperiences) {
      return;
    }
    this._observed = true;
    this._disconnect = revealOnScroll(
      this.template.querySelectorAll("[data-reveal]")
    );
  }

  disconnectedCallback() {
    if (this._disconnect) {
      this._disconnect();
    }
  }
}
