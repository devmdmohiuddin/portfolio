/**
 * portfolioMotion — shared motion toolkit (Sprint 0)
 * ------------------------------------------------------------------
 * A tiny, dependency-free utility every section opts into:
 *
 *   - prefersReducedMotion()  → honor the user's OS-level motion setting
 *   - revealOnScroll(...)      → one IntersectionObserver that adds an
 *                                `is-visible` class as elements enter view
 *   - stagger(...)             → apply incremental transition-delay for a
 *                                cascading entrance
 *
 * CSS-first by design: JS only toggles classes / sets a delay custom
 * property. All actual animation lives in component CSS keyed off the
 * `is-visible` class, and every animation is gated behind
 * `prefers-reduced-motion` in CSS as well.
 */

const REVEAL_CLASS = "is-visible";

/**
 * True when the user has asked the OS to minimize non-essential motion.
 * Guarded for SSR / test environments where matchMedia may be absent.
 */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Observe elements and add `is-visible` when they scroll into view.
 *
 * @param {Element[]|NodeList} elements  elements to reveal
 * @param {Object}  [options]
 * @param {string}  [options.revealClass="is-visible"] class toggled on reveal
 * @param {number}  [options.threshold=0.1]  visibility ratio that triggers reveal
 * @param {string}  [options.rootMargin="0px 0px -10% 0px"] observer root margin
 * @param {boolean} [options.once=true]  stop observing after first reveal
 * @param {(el: Element) => void} [options.onReveal]  called when an element
 *        reveals (immediately under reduced motion) — e.g. to start a counter
 * @returns {() => void}  disconnect function (safe to call in disconnectedCallback)
 */
export function revealOnScroll(elements, options = {}) {
  const {
    revealClass = REVEAL_CLASS,
    threshold = 0.1,
    rootMargin = "0px 0px -10% 0px",
    once = true,
    onReveal
  } = options;

  const items = Array.from(elements || []).filter(Boolean);
  if (items.length === 0) {
    return () => {};
  }

  // Reduced motion or no IntersectionObserver → reveal immediately, no animation.
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    items.forEach((el) => {
      el.classList.add(revealClass);
      if (onReveal) {
        onReveal(el);
      }
    });
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add(revealClass);
        if (onReveal) {
          onReveal(entry.target);
        }
        if (once) {
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold, rootMargin }
  );

  items.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

/**
 * Give each element an incremental `--pf-delay` custom property so CSS can
 * cascade their entrance. No-op (all delays zero) under reduced motion.
 *
 * @param {Element[]|NodeList} elements
 * @param {number} [step=100]  delay increment per item, in milliseconds
 * @param {number} [base=0]    delay applied to the first item, in milliseconds
 */
export function stagger(elements, step = 100, base = 0) {
  const items = Array.from(elements || []).filter(Boolean);
  const reduced = prefersReducedMotion();
  items.forEach((el, i) => {
    const delay = reduced ? 0 : base + i * step;
    el.style.setProperty("--pf-delay", `${delay}ms`);
  });
}
