import { LightningElement, api, track } from "lwc";
import submitMessage from "@salesforce/apex/ContactController.submitMessage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * contactDialog — an accessible, animated "Get In Touch" modal.
 *
 * Opened imperatively via `open()` from a trigger button in another component
 * (hero CTA, contact section). Collects name, email, phone, and message and
 * submits them to ContactController, which stores a Contact_Message__c record
 * and emails a notification. Closes on the ✕, the backdrop, or Escape; entrance
 * animates in and collapses to instant under `prefers-reduced-motion` (CSS).
 */
export default class ContactDialog extends LightningElement {
  @track form = { name: "", email: "", phone: "", message: "" };
  isOpen = false;
  renderedOpen = false;
  isSubmitting = false;
  isSuccess = false;
  errorMessage = "";
  _successName = "";

  /** Open the dialog and focus the first field. */
  @api
  open() {
    this.resetState();
    this.isOpen = true;
    document.addEventListener("keydown", this._onKeydown);
    // Let the DOM mount, then trigger the entrance and move focus in.
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    requestAnimationFrame(() => {
      this.renderedOpen = true;
      const first = this.template.querySelector(".pf-dialog__input");
      if (first) {
        first.focus();
      }
    });
  }

  /** Close the dialog and release the key listener. */
  @api
  close() {
    this.isOpen = false;
    this.renderedOpen = false;
    document.removeEventListener("keydown", this._onKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown);
  }

  get submitLabel() {
    return this.isSubmitting ? "Sending…" : "Send Message";
  }

  get successName() {
    return this._successName ? `, ${this._successName}` : "";
  }

  handleInput(event) {
    this.form = { ...this.form, [event.target.name]: event.target.value };
    if (this.errorMessage) {
      this.errorMessage = "";
    }
  }

  handleBackdrop(event) {
    // Only a click on the backdrop itself (not the dialog card) closes it.
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const name = this.form.name.trim();
    const email = this.form.email.trim();
    const message = this.form.message.trim();

    if (!name) {
      this.errorMessage = "Please enter your name.";
      return;
    }
    if (!EMAIL_RE.test(email)) {
      this.errorMessage = "Please enter a valid email address.";
      return;
    }
    if (!message) {
      this.errorMessage = "Please enter a message.";
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = "";
    try {
      await submitMessage({
        name,
        email,
        phone: this.form.phone.trim(),
        message
      });
      this._successName = name;
      this.isSuccess = true;
    } catch (error) {
      this.errorMessage =
        error?.body?.message || "Something went wrong. Please try again.";
    } finally {
      this.isSubmitting = false;
    }
  }

  resetState() {
    this.form = { name: "", email: "", phone: "", message: "" };
    this.isSubmitting = false;
    this.isSuccess = false;
    this.errorMessage = "";
    this._successName = "";
  }

  _onKeydown = (event) => {
    if (event.key === "Escape") {
      this.close();
    }
  };
}
