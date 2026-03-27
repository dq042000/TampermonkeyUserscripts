// ==UserScript==
// @name         GitLab Sidebar Hotkey
// @version      1.0.0
// @description  按下 Ctrl+B 快速切換 GitLab 左側 sidebar
// @namespace    https://github.com/dq042000/TampermonkeyUserscripts
// @source       https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/GitLabSidebarHotkey.user.js
// @match        *://*/*
// @author       Mike Ci
// @icon         https://www.google.com/s2/favicons?domain=gitlab.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

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

    return Boolean(
      typeof element.closest === "function" &&
      element.closest(
        '[contenteditable="true"], .ProseMirror, .tiptap, .monaco-editor'
      )
    );
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

  document.addEventListener(
    "keydown",
    (event) => {
      if (!matchesToggleHotkey(event)) {
        return;
      }

      if (!isLikelyGitLabPage(document)) {
        return;
      }

      if (
        isEditableElement(event.target) ||
        isEditableElement(document.activeElement)
      ) {
        return;
      }

      const toggleButton = findSidebarToggleElement(document);
      if (!toggleButton) {
        console.debug("[GitLabSidebarHotkey] Sidebar toggle button not found.");
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      toggleButton.click();
    },
    true
  );
})();
