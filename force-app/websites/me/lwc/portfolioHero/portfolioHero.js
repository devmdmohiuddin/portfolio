import { LightningElement, wire } from "lwc";
import getConfig from "@salesforce/apex/PortfolioController.getConfig";
import { prefersReducedMotion } from "c/portfolioMotion";

/**
 * portfolioHero — the landing section.
 *
 * Renders "Hi, my name is / {Name} / {Tagline}", the intro, and a CTA — all
 * from Portfolio_Config__mdt, so the copy is data, not code. On load the
 * lines reveal in a staggered cascade (greeting types in like a terminal);
 * everything collapses to a static state under `prefers-reduced-motion`.
 */
// Typewriter timings (ms).
const TYPE_SPEED = 75;
const DELETE_SPEED = 40;
const HOLD_FULL = 1500;
const HOLD_EMPTY = 350;

export default class PortfolioHero extends LightningElement {
  config;
  error;
  /** Flips to true after first paint so the CSS entrance can run. */
  loaded = false;
  /** The currently visible (partially typed) role text. */
  roleText = "";
  _roleIdx = 0;
  _charIdx = 0;
  _phase = "typing";
  _typeTimer;
  _typeStarted = false;

  @wire(getConfig)
  wiredConfig({ data, error }) {
    if (data) {
      this.config = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.config = undefined;
    }
  }

  /** Roles shown in the rotating tagline (falls back to the tagline text). */
  get roles() {
    const raw = this.config?.Roles__c || this.config?.Tagline__c || "";
    return raw
      .split("|")
      .map((role) => role.trim())
      .filter(Boolean);
  }

  get hasRoles() {
    return this.roles.length > 0;
  }

  get rolesJoined() {
    return this.roles.join(" · ");
  }

  get reducedMotion() {
    return prefersReducedMotion();
  }

  openDialog() {
    const dialog = this.template.querySelector("c-contact-dialog");
    if (dialog) {
      dialog.open();
    }
  }

  /** Kick off the role typewriter once (skipped under reduced motion). */
  startTypewriter() {
    if (this._typeStarted || prefersReducedMotion() || !this.roles.length) {
      return;
    }
    this._typeStarted = true;
    this.tickTypewriter();
  }

  /**
   * Self-scheduling typewriter: types the active role letter-by-letter, holds,
   * deletes it, then advances to the next role and repeats.
   */
  tickTypewriter() {
    const roles = this.roles;
    if (!roles.length) {
      return;
    }
    const current = roles[this._roleIdx % roles.length];
    let delay = TYPE_SPEED;

    if (this._phase === "typing") {
      this._charIdx += 1;
      this.roleText = current.substring(0, this._charIdx);
      if (this._charIdx >= current.length) {
        this._phase = "holding";
        delay = HOLD_FULL;
      }
    } else if (this._phase === "holding") {
      this._phase = "deleting";
      delay = DELETE_SPEED;
    } else {
      this._charIdx -= 1;
      this.roleText = current.substring(0, Math.max(this._charIdx, 0));
      if (this._charIdx <= 0) {
        this._phase = "typing";
        this._roleIdx = (this._roleIdx + 1) % roles.length;
        delay = HOLD_EMPTY;
      } else {
        delay = DELETE_SPEED;
      }
    }

    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._typeTimer = setTimeout(() => this.tickTypewriter(), delay);
  }

  /** Fixed greeting line; the character count keys the typewriter width. */
  get greeting() {
    return "Hi, my name is";
  }

  get fullName() {
    return this.config?.Full_Name__c || "";
  }

  get tagline() {
    return this.config?.Tagline__c || "";
  }

  get intro() {
    return this.config?.Intro__c || "";
  }

  renderedCallback() {
    // Begin typing roles once the config (and thus the roles) has loaded.
    this.startTypewriter();

    if (this.loaded) {
      return;
    }
    if (prefersReducedMotion()) {
      // No entrance to schedule — show everything immediately.
      this.loaded = true;
      return;
    }
    // Defer a frame so the start state paints before the transition kicks in.
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    requestAnimationFrame(() => {
      this.loaded = true;
    });
  }

  disconnectedCallback() {
    if (this._typeTimer) {
      clearTimeout(this._typeTimer);
      this._typeTimer = undefined;
    }
  }
}
