// ==UserScript==
// @name         ChatGPT 快捷鍵
// @version      1.0.1
// @description  Ctrl+B 切換左側選單；Ctrl+Delete 刪除當前對話
// @namespace    https://github.com/dq042000/TampermonkeyUserscripts
// @source       https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/ChatGptHotkeys.user.js
// @match        https://chatgpt.com/*
// @run-at       document-start
// @author       Mike Ci
// @icon         https://www.google.com/s2/favicons?domain=chatgpt.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

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

  function matchesDeleteHotkey(event) {
    const key = normalizeText(event.key);
    const code = normalizeText(event.code);

    return (
      (key === "delete" || code === "delete") &&
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
        element.closest('[contenteditable="true"], .ProseMirror, .tiptap')
      );
    }

    return false;
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
        value.includes("hide sidebar") ||
        value.includes("側邊欄")
    );
  }

  function isOptionsButtonTrigger(candidate) {
    const fields = [
      normalizeText(candidate.ariaLabel),
      normalizeText(candidate.title),
      normalizeText(candidate.dataset && candidate.dataset.testid)
    ];

    return fields.some(
      (value) =>
        value.includes("chat options") ||
        value.includes("more options") ||
        value.includes("conversation options") ||
        value.includes("chat controls")
    );
  }

  function findSidebarToggleElement() {
    const knownSelectors = [
      'button[aria-label="開啟側邊欄"]',
      'button[aria-label="關閉側邊欄"]',
      '[data-testid="close-sidebar-button"]',
      '[data-testid="open-sidebar-button"]',
      '[data-testid*="sidebar-toggle"]',
      'button[aria-label="Close sidebar"]',
      'button[aria-label="Open sidebar"]',
      'button[aria-label="Toggle sidebar"]',
      '[aria-controls*="sidebar"]',
      '[data-testid*="sidebar"]'
    ];

    for (const selector of knownSelectors) {
      const el = document.querySelector(selector);
      if (el && !el.closest("[inert]")) {
        return el;
      }
    }

    const candidates = document.querySelectorAll("button, a, [role='button']");

    for (const candidate of candidates) {
      if (
        !candidate.closest("[inert]") &&
        isSidebarToggleTrigger(getCandidateMetadata(candidate))
      ) {
        return candidate;
      }
    }

    return null;
  }

  function findOptionsButton() {
    const knownSelectors = [
      '[data-testid="conversation-options-button"]',
      '[data-testid*="chat-options"]',
      '[data-testid*="conversation-options"]',
      'button[aria-label="Chat options"]',
      'button[aria-label="More options"]',
      'button[aria-label="Chat controls"]',
      'button[aria-label="Conversation options"]'
    ];

    for (const selector of knownSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        return el;
      }
    }

    const candidates = document.querySelectorAll("button, [role='button']");

    for (const candidate of candidates) {
      if (isOptionsButtonTrigger(getCandidateMetadata(candidate))) {
        return candidate;
      }
    }

    return null;
  }

  function findDeleteMenuItem() {
    const knownSelectors = [
      '[data-testid="delete-chat-menu-item"]',
      '[data-testid*="delete-chat"]',
      '[data-testid*="delete-conversation"]'
    ];

    for (const selector of knownSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        return el;
      }
    }

    const menuItems = document.querySelectorAll(
      '[role="menuitem"], [role="option"]'
    );

    for (const item of menuItems) {
      if (normalizeText(item.textContent) === "delete") {
        return item;
      }
    }

    return null;
  }

  function findDeleteConfirmButton() {
    const knownSelectors = [
      '[data-testid="delete-conversation-confirm-button"]',
      '[data-testid*="confirm-delete"]',
      '[data-testid*="delete-confirm"]'
    ];

    for (const selector of knownSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        return el;
      }
    }

    const dialogButtons = document.querySelectorAll(
      'dialog button, [role="dialog"] button, [role="alertdialog"] button'
    );

    for (const btn of dialogButtons) {
      const text = normalizeText(btn.textContent);
      if (text === "delete" || text === "confirm") {
        return btn;
      }
    }

    return null;
  }

  function waitForElement(selectorOrPredicate, timeout) {
    const ms = typeof timeout === "number" ? timeout : 3000;

    return new Promise((resolve) => {
      const check =
        typeof selectorOrPredicate === "function"
          ? selectorOrPredicate
          : () => document.querySelector(selectorOrPredicate);

      const existing = check();
      if (existing) {
        resolve(existing);
        return;
      }

      const timer = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, ms);

      const observer = new MutationObserver(() => {
        const el = check();
        if (el) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  function handleToggleSidebar() {
    const btn = findSidebarToggleElement();
    if (btn) {
      btn.click();
    }
  }

  async function handleDeleteConversation() {
    const optionsBtn = findOptionsButton();
    if (!optionsBtn) {
      return;
    }
    optionsBtn.click();

    const deleteItem = await waitForElement(findDeleteMenuItem, 3000);
    if (!deleteItem) {
      return;
    }
    deleteItem.click();

    const confirmBtn = await waitForElement(findDeleteConfirmButton, 3000);
    if (!confirmBtn) {
      return;
    }
    confirmBtn.click();
  }

  window.addEventListener(
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

      if (matchesDeleteHotkey(event)) {
        if (
          isEditableElement(event.target) ||
          isEditableElement(document.activeElement)
        ) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        handleDeleteConversation();
      }
    },
    true
  );
})();
