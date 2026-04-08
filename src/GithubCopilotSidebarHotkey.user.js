// ==UserScript==
// @name         GitHub Copilot Sidebar Hotkey
// @version      1.0.0
// @description  按下 Ctrl+B 快速切換 GitHub Copilot 左側對話列表面板
// @namespace    https://github.com/dq042000/TampermonkeyUserscripts
// @source       https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/GithubCopilotSidebarHotkey.user.js
// @match        *://github.com/copilot*
// @run-at       document-start
// @author       Mike Ci
// @icon         https://www.google.com/s2/favicons?domain=github.com
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

  document.addEventListener(
    "keydown",
    (event) => {
      if (!matchesToggleHotkey(event)) {
        return;
      }

      // Check editable focus BEFORE claiming the event so Ctrl+B for bold
      // text in the chat editor continues to work normally.
      if (
        isEditableElement(event.target) ||
        isEditableElement(document.activeElement)
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const toggleButton = findSidebarToggleElement(document);
      if (!toggleButton) {
        console.debug(
          "[GithubCopilotSidebarHotkey] Sidebar toggle button not found."
        );
        return;
      }

      toggleButton.click();
    },
    true
  );
})();
