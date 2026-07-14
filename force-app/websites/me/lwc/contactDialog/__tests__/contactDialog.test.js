import { createElement } from "lwc";
import ContactDialog from "c/contactDialog";
import submitMessage from "@salesforce/apex/ContactController.submitMessage";

jest.mock(
  "@salesforce/apex/ContactController.submitMessage",
  () => ({ default: jest.fn(() => Promise.resolve()) }),
  { virtual: true }
);

describe("c-contact-dialog", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  function createComponent() {
    const element = createElement("c-contact-dialog", { is: ContactDialog });
    document.body.appendChild(element);
    return element;
  }

  function setValue(element, name, value) {
    const field = element.shadowRoot.querySelector(`[name="${name}"]`);
    field.value = value;
    field.dispatchEvent(new CustomEvent("input"));
  }

  it("renders nothing until opened", () => {
    const element = createComponent();
    expect(element.shadowRoot.querySelector(".pf-dialog")).toBeNull();
  });

  it("shows the form when opened", async () => {
    const element = createComponent();
    element.open();
    await Promise.resolve();

    expect(element.shadowRoot.querySelector(".pf-dialog")).not.toBeNull();
    expect(element.shadowRoot.querySelector('[name="email"]')).not.toBeNull();
  });

  it("validates required fields before submitting", async () => {
    const element = createComponent();
    element.open();
    await Promise.resolve();

    element.shadowRoot
      .querySelector(".pf-dialog__form")
      .dispatchEvent(new CustomEvent("submit"));
    await Promise.resolve();

    expect(submitMessage).not.toHaveBeenCalled();
    expect(
      element.shadowRoot.querySelector(".pf-dialog__error").textContent
    ).toBe("Please enter your name.");
  });

  it("submits valid input and shows the success state", async () => {
    submitMessage.mockResolvedValue("a01000000000001AAA");
    const element = createComponent();
    element.open();
    await Promise.resolve();

    setValue(element, "name", "Jane Doe");
    setValue(element, "email", "jane@example.com");
    setValue(element, "phone", "555-0101");
    setValue(element, "message", "Hello!");

    element.shadowRoot
      .querySelector(".pf-dialog__form")
      .dispatchEvent(new CustomEvent("submit"));
    await Promise.resolve();
    await Promise.resolve();

    expect(submitMessage).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-0101",
      message: "Hello!"
    });
    expect(
      element.shadowRoot.querySelector(".pf-dialog__success")
    ).not.toBeNull();
  });
});
