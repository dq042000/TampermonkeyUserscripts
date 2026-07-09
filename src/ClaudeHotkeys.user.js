// ==UserScript==
// @name         Claude.ai 快捷鍵
// @version      1.1.2
// @description  按下 Ctrl+B 切換左側選單；按下 Ctrl+Delete 刪除當前對話（含自動確認）；按下 Ctrl+Shift+U 開啟 Settings > Usage
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
      .replace(/[\uE000-\uF8FF]/g, "") // 過濾圖示字型使用的私有區塊字元（Private Use Area）
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

  // Ctrl+Delete — delete current conversation
  function matchesDeleteChatHotkey(event) {
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

  // Ctrl+Shift+U — open Settings > Usage
  function matchesUsageHotkey(event) {
    const key = normalizeText(event.key);
    const code = normalizeText(event.code);

    return (
      (key === "u" || code === "keyu") &&
      Boolean(event.ctrlKey) &&
      Boolean(event.shiftKey) &&
      !event.altKey &&
      !event.metaKey
    );
  }

  function waitAndClick(selector, maxWait, onClicked) {
    const start = Date.now();
    const timer = setInterval(function () {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        el.click();
        if (onClicked) onClicked();
      } else if (Date.now() - start > maxWait) {
        clearInterval(timer);
      }
    }, 50);
  }

  // 模擬更接近真人操作的完整事件序列，避免某些元件（如 Radix UI）
  // 忽略單純呼叫 .click() 產生的合成點擊
  function simulateRealClick(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const eventInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      view: window
    };

    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(
      (type) => {
        let evt;
        try {
          evt = type.startsWith("pointer")
            ? new PointerEvent(type, eventInit)
            : new MouseEvent(type, eventInit);
        } catch (e) {
          evt = new MouseEvent(type, eventInit);
        }
        element.dispatchEvent(evt);
      }
    );
  }

  // Claude.ai 的確認刪除按鈕沒有 data-testid，只能靠按鈕文字比對
  function waitAndClickButtonByText(
    containerSelector,
    text,
    maxWait,
    onClicked
  ) {
    const start = Date.now();
    const target = normalizeText(text);
    const timer = setInterval(function () {
      const container = document.querySelector(containerSelector);
      if (container) {
        const btn = Array.from(container.querySelectorAll("button")).find(
          (b) => normalizeText(b.textContent) === target
        );
        if (btn) {
          clearInterval(timer);
          simulateRealClick(btn);
          if (onClicked) onClicked(btn);
          return;
        }
      }
      if (Date.now() - start > maxWait) {
        clearInterval(timer);
      }
    }, 50);
  }

  function findAlertDialog() {
    return (
      document.querySelector('[role="alertdialog"]') ||
      document.querySelector('[role="dialog"]')
    );
  }

  // 點擊確認鍵後檢查視窗是否真的關閉，沒關就再試幾次
  function confirmDeleteWithRetry(attemptsLeft) {
    waitAndClickButtonByText(
      '[role="alertdialog"], [role="dialog"]',
      "Delete",
      1000,
      function () {
        setTimeout(function () {
          const stillOpen = findAlertDialog();
          if (stillOpen && attemptsLeft > 0) {
            confirmDeleteWithRetry(attemptsLeft - 1);
          }
        }, 250);
      }
    );
  }

  // 目前 Claude.ai 的對話選單按鈕沒有 data-testid，只有 aria-label="More options for ..."
  function findChatMenuTrigger() {
    const explicit = document.querySelector(
      '[data-testid="chat-menu-trigger"]'
    );
    if (explicit) return explicit;

    // 優先找「目前開啟中對話」在側邊欄對應的 More options 按鈕，避免刪錯對話
    const match = location.pathname.match(/\/chat\/([^/?#]+)/);
    if (match) {
      const currentId = match[1];
      const link = document.querySelector(`[href="/chat/${currentId}"]`);
      const row = link && link.closest("div.relative.group, li");
      const scopedBtn =
        row && row.querySelector('button[aria-label^="More options"]');
      if (scopedBtn) return scopedBtn;
    }

    // 備援：抓側邊欄第一個 More options 按鈕
    return document.querySelector('button[aria-label^="More options"]');
  }

  function handleDeleteChat() {
    const menuTrigger = findChatMenuTrigger();
    if (!menuTrigger) return;

    menuTrigger.click();

    waitAndClick('[data-testid="delete-chat-trigger"]', 1000, function () {
      setTimeout(function () {
        confirmDeleteWithRetry(2);
      }, 300);
    });
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

  // Settings 對話框裡的「Usage」分頁按鈕沒有 data-testid，只能靠按鈕文字比對
  function findUsageTabButton() {
    return Array.from(document.querySelectorAll("button")).find(
      (b) => normalizeText(b.textContent) === "usage"
    );
  }

  function handleOpenUsage() {
    const existingUsageBtn = findUsageTabButton();
    if (existingUsageBtn) {
      existingUsageBtn.click();
      return;
    }

    const menuTrigger = document.querySelector(
      '[data-testid="user-menu-button"]'
    );
    if (!menuTrigger) return;

    menuTrigger.click();

    waitAndClick('[data-testid="user-menu-settings"]', 1000, function () {
      setTimeout(function () {
        const btn = findUsageTabButton();
        if (btn) btn.click();
      }, 300);
    });
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
      }

      if (matchesDeleteChatHotkey(event)) {
        if (
          isEditableElement(event.target) ||
          isEditableElement(document.activeElement)
        ) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        handleDeleteChat();
      }

      if (matchesUsageHotkey(event)) {
        if (
          isEditableElement(event.target) ||
          isEditableElement(document.activeElement)
        ) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        handleOpenUsage();
      }
    },
    true
  );
})();
