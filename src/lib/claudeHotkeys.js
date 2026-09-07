function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function matchesSidebarHotkey(event) {
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

function matchesSettingsHotkey(event) {
  const key = normalizeText(event.key);
  const code = normalizeText(event.code);

  return (
    (key === "s" || code === "keys") &&
    Boolean(event.altKey) &&
    !event.ctrlKey &&
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
      element.closest('[contenteditable="true"], .ProseMirror, .tiptap')
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
      value.includes("close sidebar") ||
      value.includes("open sidebar") ||
      value.includes("toggle sidebar") ||
      value.includes("collapse sidebar") ||
      value.includes("expand sidebar") ||
      value.includes("show sidebar") ||
      value.includes("hide sidebar")
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

// 只有 button / a / role="button" 才是真正可點的開關。
// claude.ai 現在有一個 div[data-testid="sidebar"] 容器，
// 用 [data-testid*="sidebar"] 這種寬鬆選擇器會先命中它，點了沒有作用
function isClickableControl(element) {
  if (!element) {
    return false;
  }

  const tagName = normalizeText(element.tagName);
  if (tagName === "button" || tagName === "a") {
    return true;
  }

  return (
    typeof element.getAttribute === "function" &&
    normalizeText(element.getAttribute("role")) === "button"
  );
}

function findSidebarToggleElement(doc) {
  const knownSelectors = [
    '[aria-label="Hide sidebar"]',
    '[aria-label="Show sidebar"]',
    '[data-testid="sidebar-toggle"]',
    '[aria-label="Close sidebar"]',
    '[aria-label="Open sidebar"]',
    '[aria-label="Toggle sidebar"]',
    '[aria-label="Collapse sidebar"]',
    '[aria-label="Expand sidebar"]'
  ];

  for (const selector of knownSelectors) {
    const el = doc.querySelector(selector);
    if (isClickableControl(el)) {
      return el;
    }
  }

  const candidates = doc.querySelectorAll("button, a, [role='button']");

  for (const candidate of candidates) {
    if (isSidebarToggleTrigger(getCandidateMetadata(candidate))) {
      return candidate;
    }
  }

  return null;
}

function findSettingsElement(doc) {
  const knownSelectors = [
    'a[href="/settings"]',
    'a[href*="/settings"]',
    '[data-testid="settings"]',
    '[data-testid*="settings"]',
    'button[aria-label*="Settings"]',
    'a[aria-label*="Settings"]'
  ];

  for (const selector of knownSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      return el;
    }
  }

  return null;
}

module.exports = {
  findSidebarToggleElement,
  findSettingsElement,
  getCandidateMetadata,
  isClickableControl,
  isEditableElement,
  isSidebarToggleTrigger,
  matchesSidebarHotkey,
  matchesSettingsHotkey
};
