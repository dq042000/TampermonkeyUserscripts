// ==UserScript==
// @name         Google Gemini 好用的鍵盤快速鍵集合
// @version      1.0.0
// @description  按下 Ctrl+B 快速切換側邊欄
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
        const actionsButtonSelector =
            "chat-app conversation-actions [data-test-id='actions-menu-button']";

        if (!clickIfExists(actionsButtonSelector)) return false;

        const deleteButton = await waitForElement(
            ".cdk-overlay-container [data-test-id='delete-button']",
            { timeoutMs: 2000 },
        );
        if (!deleteButton) return false;
        deleteButton.click();

        const confirmButton = await waitForElement(
            ".cdk-overlay-container [data-test-id='confirm-button']",
            { timeoutMs: 2000 },
        );
        if (!confirmButton) return false;
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
