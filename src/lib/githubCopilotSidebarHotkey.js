function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function matchesToggleHotkey(event) {
  const key = normalizeText(event.key);
  const code = normalizeText(event.code);

  return (
    (key === "b" || code === "keyb") &&
    Boolean(event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    !event.metaKey
  );
}

function isEditableElement(element) {
  if (!element) {
    return false;
  }

  const tagName = normalizeText(element.tagName);
  if (["input", "textarea", "select"].includes(tagName)) {
    return true;
  }

  if (element.isContentEditable) {
    return true;
  }

  if (typeof element.closest === "function") {
    return Boolean(
      element.closest(
        '[contenteditable="true"], .ProseMirror, .tiptap, .monaco-editor'
      )
    );
  }

  return false;
}

function isSidebarToggleTrigger(candidate) {
  const fields = [
    normalizeText(candidate.ariaLabel),
    normalizeText(candidate.title),
    normalizeText(candidate.textContent),
    normalizeText(candidate.dataset && candidate.dataset.testid)
  ];

  return fields.some(
    (value) =>
      value.includes("toggle sidebar") ||
      value.includes("collapse sidebar") ||
      value.includes("expand sidebar") ||
      value.includes("show sidebar") ||
      value.includes("hide sidebar") ||
      value.includes("open sidebar") ||
      value.includes("close sidebar") ||
      value.includes("toggle conversation") ||
      value.includes("show conversations") ||
      value.includes("hide conversations")
  );
}

function getCandidateMetadata(element) {
  return {
    ariaLabel:
      typeof element.getAttribute === "function"
        ? element.getAttribute("aria-label")
        : "",
    title:
      typeof element.getAttribute === "function"
        ? element.getAttribute("title")
        : "",
    textContent: element.textContent || "",
    dataset: element.dataset || {}
  };
}

function findSidebarToggleElement(doc) {
  // Try known GitHub Copilot sidebar toggle selectors first
  const knownSelectors = [
    '[data-testid="sidebar-toggle"]',
    '[aria-label="Toggle sidebar"]',
    '[aria-label="Collapse sidebar"]',
    '[aria-label="Expand sidebar"]',
    '[aria-label="Show sidebar"]',
    '[aria-label="Hide sidebar"]',
    '[aria-controls*="sidebar"]',
    '[data-testid*="sidebar-toggle"]'
  ];

  for (const selector of knownSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      return el;
    }
  }

  // Fall back to text/attribute-based search for unknown UI versions
  const candidates = doc.querySelectorAll("button, a, [role='button']");

  for (const candidate of candidates) {
    if (isSidebarToggleTrigger(getCandidateMetadata(candidate))) {
      return candidate;
    }
  }

  return null;
}

module.exports = {
  findSidebarToggleElement,
  getCandidateMetadata,
  isEditableElement,
  isSidebarToggleTrigger,
  matchesToggleHotkey
};
