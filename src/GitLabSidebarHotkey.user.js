// ==UserScript==
// @name         GitLab Sidebar Hotkey
// @version      1.1.0
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
    const testid = normalizeText(candidate.dataset && candidate.dataset.testid);
    if (testid === "super-sidebar-toggle" || testid === "nav-toggle") {
      return true;
    }

    const fields = [
      normalizeText(candidate.ariaLabel),
      normalizeText(candidate.title),
      normalizeText(candidate.textContent)
    ];

    return fields.some(
      (value) =>
        value.includes("collapse sidebar") ||
        value.includes("expand sidebar") ||
        value.includes("toggle sidebar") ||
        value.includes("primary navigation sidebar")
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
    // Try known GitLab sidebar toggle selectors first (covers GitLab 16+ super sidebar and older versions)
    const knownSelectors = [
      '[data-testid="super-sidebar-toggle"]',
      '[data-testid="nav-toggle"]',
      '[aria-controls="super-sidebar"]',
      '.js-super-sidebar-toggle',
      '.js-toggle-sidebar'
    ];

    for (const selector of knownSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        return el;
      }
    }

    // Fall back to text/attribute-based search for unknown versions
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

    if (
      normalizeText(
        applicationNameMeta && applicationNameMeta.getAttribute("content")
      ).includes("gitlab")
    ) {
      return true;
    }

    // Fallback: detect GitLab-specific DOM elements for self-hosted instances
    if (
      doc.querySelector(
        '#super-sidebar, .super-sidebar, [data-testid="super-sidebar-toggle"], .navbar-gitlab, .gl-dark'
      )
    ) {
      return true;
    }

    return false;
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
