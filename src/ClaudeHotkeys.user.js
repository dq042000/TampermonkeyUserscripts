// ==UserScript==
// @name         Claude.ai 快捷鍵
// @version      1.0.0
// @description  按下 Ctrl+B 切換左側選單、Alt+S 開啟設定頁面
// @namespace    https://github.com/dq042000/TampermonkeyUserscripts
// @source       https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/ClaudeHotkeys.user.js
// @match        https://claude.ai/*
// @run-at       document-start
// @author       Mike Ci
// @icon         https://www.google.com/s2/favicons?domain=claude.ai
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  // Ctrl+B — toggle sidebar (skip when in a text editor to preserve bold)
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

  // Alt+S — open settings (fires from anywhere, including editor)
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

  function findSidebarToggleElement() {
    const knownSelectors = [
      '[data-testid="sidebar-toggle"]',
      '[aria-label="Close sidebar"]',
      '[aria-label="Open sidebar"]',
      '[aria-label="Toggle sidebar"]',
      '[aria-label="Collapse sidebar"]',
      '[aria-label="Expand sidebar"]',
      '[aria-controls*="sidebar"]',
      '[data-testid*="sidebar"]'
    ];

    for (const selector of knownSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        return el;
      }
    }

    const candidates = document.querySelectorAll("button, a, [role='button']");

    for (const candidate of candidates) {
      if (isSidebarToggleTrigger(getCandidateMetadata(candidate))) {
        return candidate;
      }
    }

    return null;
  }

  function handleToggleSidebar() {
    const btn = findSidebarToggleElement();

    if (btn) {
      btn.click();
      return;
    }

    // Fallback: simulate the original Ctrl+. shortcut the app natively handles
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: ".",
        code: "Period",
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      })
    );
  }

  function handleOpenSettings() {
    const knownSelectors = [
      'a[href="/settings"]',
      'a[href*="/settings"]',
      '[data-testid="settings"]',
      '[data-testid*="settings"]',
      'button[aria-label*="Settings"]',
      'a[aria-label*="Settings"]'
    ];

    for (const selector of knownSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        el.click();
        return;
      }
    }

    // Fallback: direct SPA-friendly navigation
    window.location.href = "https://claude.ai/settings";
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (matchesSidebarHotkey(event)) {
        if (
          isEditableElement(event.target) ||
          isEditableElement(document.activeElement)
        ) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        handleToggleSidebar();
        return;
      }

      if (matchesSettingsHotkey(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        handleOpenSettings();
      }
    },
    true
  );
})();
