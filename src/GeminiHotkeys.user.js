// ==UserScript==
// @name         Google Gemini 好用的鍵盤快速鍵集合
// @version      0.1.1
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
    };

    function matchHotkey(event, hotkey) {
        return (
            event.key.toLowerCase() === hotkey.key.toLowerCase() &&
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

    function handleToggleChatApp() {
        return clickIfExists(".chat-app");
    }

    document.addEventListener("keydown", (event) => {
        if (matchHotkey(event, config.toggleChatApp)) {
            event.preventDefault();
            handleToggleChatApp();
            return;
        }
    });
})();
