// ==UserScript==
// @name         Google Gemini 好用的鍵盤快速鍵集合
// @version      1.0.4
// @description  按下 Ctrl+B 快速切換側邊欄、Ctrl+Delete 刪除當前對話
// @namespace    https://github.com/dq042000/TampermonkeyUserscripts
// @source       https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/GeminiHotkeys.user.js
// @match        https://gemini.google.com/*
// @author       Mike Ci
// @icon         https://www.google.com/s2/favicons?domain=gemini.google.com
// ==/UserScript==

(function () {
    "use strict";

    const config = {
        toggleChatApp: {
            key: "b",
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
        },
        deleteChat: {
            key: "delete",
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
        },
    };

    function matchHotkey(event, hotkey) {
        return (
            (event.key.toLowerCase() === hotkey.key.toLowerCase() ||
                event.code.toLowerCase() === `key${hotkey.key}`) &&
            Boolean(event.ctrlKey) === Boolean(hotkey.ctrlKey) &&
            Boolean(event.altKey) === Boolean(hotkey.altKey) &&
            Boolean(event.shiftKey) === Boolean(hotkey.shiftKey)
        );
    }

    function clickIfExists(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.click();
            return true;
        }
        return false;
    }

    function waitForElement(selector, options = {}) {
        const { timeoutMs = 2000, intervalMs = 50 } = options;

        return new Promise((resolve) => {
            const start = Date.now();

            function tick() {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                if (Date.now() - start >= timeoutMs) {
                    resolve(null);
                    return;
                }

                setTimeout(tick, intervalMs);
            }

            tick();
        });
    }

    function handleToggleChatApp() {
        const menuButtonSelector =
            "chat-app [data-test-id='side-nav-menu-button'] button," +
            "chat-app [data-test-id='side-nav-menu-button']";

        if (clickIfExists(menuButtonSelector)) return true;

        const root = document.querySelector("chat-app#app-root");
        if (!root) return false;

        root.dispatchEvent(
            new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
            }),
        );
        return true;
    }

    async function handleDeleteChat() {
        // 尋找對話視窗右上角的操作選單按鈕
        const actionsButtonSelectors = [
            // 最新的精確選擇器
            'chat-app button[data-test-id="conversation-actions-menu-icon-button"]',
            "chat-app conversation-actions-icon button",
            'chat-app button[aria-label*="開啟對話動作選單"]',
            'chat-app button[aria-label*="Open conversation actions menu"]',
            // 備選方案
            'chat-app .mat-drawer-content button[mat-icon-button][aria-label*="對話"]',
            'chat-app .mat-drawer-content button mat-icon[fonticon="more_vert"]',
        ];

        let actionButton = null;
        for (const selector of actionsButtonSelectors) {
            // 使用特殊處理來找到 mat-icon 的父按鈕
            if (selector.includes('mat-icon[fonticon="more_vert"]')) {
                const icon = document.querySelector(selector);
                if (icon) {
                    actionButton = icon.closest("button");
                    if (
                        actionButton &&
                        !actionButton.closest("mat-drawer, nav, .side-nav")
                    ) {
                        break;
                    }
                }
            } else {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    // 確保不在側邊欄內
                    if (
                        !element.closest("mat-drawer") &&
                        !element.closest("nav") &&
                        !element.closest(".side-nav")
                    ) {
                        actionButton = element;
                        break;
                    }
                }
                if (actionButton) break;
            }
        }

        if (!actionButton) {
            console.warn("找不到對話視窗右上角的操作選單按鈕");
            return false;
        }

        actionButton.click();

        // 等待並點擊刪除按鈕
        const deleteButtonSelectors = [
            ".cdk-overlay-container [data-test-id='delete-button']",
            ".cdk-overlay-container [data-test-id='delete-chat-button']",
            ".cdk-overlay-container button[aria-label*='Delete']",
            ".cdk-overlay-container button[aria-label*='刪除']",
            ".mat-mdc-menu-content button:has(mat-icon:contains('delete'))",
        ];

        let deleteButton = null;
        for (const selector of deleteButtonSelectors) {
            deleteButton = await waitForElement(selector, { timeoutMs: 2000 });
            if (deleteButton) break;
        }

        if (!deleteButton) {
            console.warn("找不到刪除按鈕");
            return false;
        }
        deleteButton.click();

        // 等待並點擊確認按鈕
        const confirmButtonSelectors = [
            ".cdk-overlay-container [data-test-id='confirm-button']",
            ".cdk-overlay-container [data-test-id='delete-confirm-button']",
            ".cdk-overlay-container button[aria-label*='Delete']",
            ".cdk-overlay-container button[aria-label*='確認']",
            ".cdk-overlay-container .mdc-dialog__actions button:last-child",
        ];

        let confirmButton = null;
        for (const selector of confirmButtonSelectors) {
            confirmButton = await waitForElement(selector, { timeoutMs: 2000 });
            if (confirmButton) break;
        }

        if (!confirmButton) {
            console.warn("找不到確認按鈕");
            return false;
        }
        confirmButton.click();
        return true;
    }

    document.addEventListener(
        "keydown",
        (event) => {
            if (matchHotkey(event, config.toggleChatApp)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                handleToggleChatApp();
                return;
            }

            if (matchHotkey(event, config.deleteChat)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                handleDeleteChat();
            }
        },
        true,
    );
})();
