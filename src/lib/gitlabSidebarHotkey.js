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
      value.includes("collapse sidebar") || value.includes("expand sidebar")
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
  const candidates = doc.querySelectorAll("button, a, [role='button']");

  for (const candidate of candidates) {
    if (isSidebarToggleTrigger(getCandidateMetadata(candidate))) {
      return candidate;
    }
  }

  return null;
}

function isLikelyGitLabPage(doc) {
  const applicationNameMeta = doc.querySelector(
    'meta[name="application-name"]'
  );

  return normalizeText(
    applicationNameMeta && applicationNameMeta.getAttribute("content")
  ).includes("gitlab");
}

module.exports = {
  findSidebarToggleElement,
  getCandidateMetadata,
  isLikelyGitLabPage,
  isEditableElement,
  isSidebarToggleTrigger,
  matchesToggleHotkey
};
