# GitLab Sidebar Hotkey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增一支適用於所有 GitLab 網站的 Ctrl+B 左側 sidebar 快捷鍵腳本，並讓 CloudSchool 腳本移除重複的左側快捷鍵。

**Architecture:** 以獨立的 GitLab userscript 實作左側 sidebar 熱鍵，邏輯優先尋找 GitLab 既有的切換按鈕並觸發 click，不直接操作版面 class。為了讓核心判斷邏輯可測試，新增一個小型 CommonJS helper 模組，將可編輯區域判斷、快捷鍵比對與切換按鈕辨識抽離成純函式，再由 userscript 使用同一份邏輯。

**Tech Stack:** Tampermonkey userscript、Node.js 內建 test runner、CommonJS

---

### Task 1: 建立可測試的 GitLab sidebar helper

**Files:**
- Create: `package.json`
- Create: `src/lib/gitlabSidebarHotkey.js`
- Create: `tests/gitlabSidebarHotkey.test.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    isEditableElement,
    matchesToggleHotkey,
    isSidebarToggleTrigger,
} = require("../src/lib/gitlabSidebarHotkey");

test("matchesToggleHotkey accepts Ctrl+B without extra modifiers", () => {
    assert.equal(
        matchesToggleHotkey({
            key: "b",
            code: "KeyB",
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
            metaKey: false,
        }),
        true,
    );

    assert.equal(
        matchesToggleHotkey({
            key: "b",
            code: "KeyB",
            ctrlKey: true,
            altKey: true,
            shiftKey: false,
            metaKey: false,
        }),
        false,
    );
});

test("isEditableElement returns true for editable controls", () => {
    assert.equal(isEditableElement({ tagName: "INPUT" }), true);
    assert.equal(isEditableElement({ tagName: "TEXTAREA" }), true);
    assert.equal(
        isEditableElement({
            tagName: "DIV",
            isContentEditable: true,
            closest: () => null,
        }),
        true,
    );
});

test("isSidebarToggleTrigger matches collapse and expand labels", () => {
    assert.equal(
        isSidebarToggleTrigger({
            ariaLabel: "Collapse sidebar",
            title: "",
            textContent: "",
            dataset: {},
        }),
        true,
    );

    assert.equal(
        isSidebarToggleTrigger({
            ariaLabel: "Expand sidebar",
            title: "",
            textContent: "",
            dataset: {},
        }),
        true,
    );

    assert.equal(
        isSidebarToggleTrigger({
            ariaLabel: "Open shortcuts",
            title: "",
            textContent: "",
            dataset: {},
        }),
        false,
    );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && node --test tests/gitlabSidebarHotkey.test.js`
Expected: FAIL with module not found for `../src/lib/gitlabSidebarHotkey`.

- [ ] **Step 3: Write minimal implementation**

```js
function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
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
                '[contenteditable="true"], .ProseMirror, .tiptap, .monaco-editor',
            ),
        );
    }

    return false;
}

function isSidebarToggleTrigger(candidate) {
    const fields = [
        normalizeText(candidate.ariaLabel),
        normalizeText(candidate.title),
        normalizeText(candidate.textContent),
        normalizeText(candidate.dataset && candidate.dataset.testid),
    ];

    return fields.some(
        (value) =>
            value.includes("collapse sidebar") ||
            value.includes("expand sidebar"),
    );
}

module.exports = {
    isEditableElement,
    isSidebarToggleTrigger,
    matchesToggleHotkey,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && node --test tests/gitlabSidebarHotkey.test.js`
Expected: PASS with 3 passing tests.

### Task 2: 實作 GitLab 通用 userscript

**Files:**
- Create: `src/GitLabSidebarHotkey.user.js`
- Modify: `src/lib/gitlabSidebarHotkey.js`
- Test: `tests/gitlabSidebarHotkey.test.js`

- [ ] **Step 1: Write the failing test**

```js
test("findSidebarToggleElement returns the first matching control", () => {
    const matchingButton = {
        tagName: "BUTTON",
        getAttribute(name) {
            return name === "aria-label" ? "Collapse sidebar" : "";
        },
        textContent: "",
        dataset: {},
    };

    const documentStub = {
        querySelectorAll() {
            return [
                {
                    tagName: "BUTTON",
                    getAttribute: () => "Open shortcuts",
                    textContent: "",
                    dataset: {},
                },
                matchingButton,
            ];
        },
    };

    assert.equal(findSidebarToggleElement(documentStub), matchingButton);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && node --test tests/gitlabSidebarHotkey.test.js`
Expected: FAIL with `findSidebarToggleElement is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
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
        dataset: element.dataset || {},
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

module.exports = {
    findSidebarToggleElement,
    getCandidateMetadata,
    isEditableElement,
    isSidebarToggleTrigger,
    matchesToggleHotkey,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && node --test tests/gitlabSidebarHotkey.test.js`
Expected: PASS with 4 passing tests.

- [ ] **Step 5: Write the userscript**

```js
// ==UserScript==
// @name         GitLab Sidebar Hotkey
// @version      1.0.0
// @description  按下 Ctrl+B 快速切換 GitLab 左側 sidebar
// @namespace    https://github.com/dq042000/TampermonkeyUserscripts
// @source       https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/GitLabSidebarHotkey.user.js
// @match        https://gitlab.com/*
// @match        https://gitlab.*/*
// @match        https://*/*
// @author       Mike Ci
// @icon         https://www.google.com/s2/favicons?domain=gitlab.com
// ==/UserScript==

(function () {
    "use strict";

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase();
    }

    function matchesToggleHotkey(event) {
        const key = normalizeText(event.key);
        const code = normalizeText(event.code);
        return (
            (key === "b" || code === "keyb") &&
            event.ctrlKey &&
            !event.altKey &&
            !event.shiftKey &&
            !event.metaKey
        );
    }

    function isEditableElement(element) {
        if (!element) return false;
        const tagName = normalizeText(element.tagName);
        if (["input", "textarea", "select"].includes(tagName)) return true;
        if (element.isContentEditable) return true;
        return Boolean(
            typeof element.closest === "function" &&
                element.closest(
                    '[contenteditable="true"], .ProseMirror, .tiptap, .monaco-editor',
                ),
        );
    }

    function getCandidateMetadata(element) {
        return {
            ariaLabel: element.getAttribute("aria-label"),
            title: element.getAttribute("title"),
            textContent: element.textContent || "",
            dataset: element.dataset || {},
        };
    }

    function isSidebarToggleTrigger(candidate) {
        const fields = [
            normalizeText(candidate.ariaLabel),
            normalizeText(candidate.title),
            normalizeText(candidate.textContent),
            normalizeText(candidate.dataset.testid),
        ];

        return fields.some(
            (value) =>
                value.includes("collapse sidebar") ||
                value.includes("expand sidebar"),
        );
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

    document.addEventListener(
        "keydown",
        (event) => {
            if (!matchesToggleHotkey(event)) return;
            if (isEditableElement(event.target) || isEditableElement(document.activeElement)) {
                return;
            }

            const toggleButton = findSidebarToggleElement(document);
            if (!toggleButton) {
                console.debug("[GitLabSidebarHotkey] Sidebar toggle button not found.");
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            toggleButton.click();
        },
        true,
    );
})();
```

- [ ] **Step 6: Run test to verify it still passes**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && node --test tests/gitlabSidebarHotkey.test.js`
Expected: PASS with 4 passing tests.

### Task 3: 調整 CloudSchool 腳本與 README

**Files:**
- Modify: `src/CloudschoolHotkeys.user.js`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

```js
test("cloudschool script description no longer mentions Ctrl+B", async () => {
    const fs = require("node:fs/promises");
    const source = await fs.readFile("src/CloudschoolHotkeys.user.js", "utf8");
    assert.equal(source.includes("Ctrl+B"), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && node --test tests/gitlabSidebarHotkey.test.js`
Expected: FAIL because `Ctrl+B` is still present in `src/CloudschoolHotkeys.user.js`.

- [ ] **Step 3: Write minimal implementation**

```js
// CloudschoolHotkeys.user.js
// @version      1.3.0
// @description  按下 Alt+R 快速切換 Issue 側邊欄。

(function () {
    "use strict";

    function isProjectPage() {
        const path = location.pathname.split("/").filter(Boolean);
        return path.length >= 2;
    }

    if (!isProjectPage()) {
        return;
    }

    const rightLayoutSelector =
        "div.layout-page.hide-when-top-nav-responsive-open";
    const rightAsideSelector = 'aside[aria-label="issue"]';

    function toggleRightSidebar() {
        const layout = document.querySelector(rightLayoutSelector);
        const aside = document.querySelector(rightAsideSelector);

        if (!layout || !aside) return;

        const isExpanded = layout.classList.contains("right-sidebar-expanded");
        const expandIcon = aside.querySelector("svg.js-sidebar-expand");
        const collapseIcon = aside.querySelector("svg.js-sidebar-collapse");

        if (isExpanded) {
            layout.classList.remove("right-sidebar-expanded");
            layout.classList.add("right-sidebar-collapsed");
            aside.className =
                "right-sidebar js-right-sidebar js-issuable-sidebar right-sidebar-collapsed";
            expandIcon && expandIcon.classList.remove("hidden");
            collapseIcon && collapseIcon.classList.add("hidden");
            return;
        }

        layout.classList.remove("right-sidebar-collapsed");
        layout.classList.add("right-sidebar-expanded");
        aside.className =
            "right-sidebar js-right-sidebar js-issuable-sidebar right-sidebar-expanded";
        expandIcon && expandIcon.classList.add("hidden");
        collapseIcon && collapseIcon.classList.remove("hidden");
    }

    document.addEventListener("keydown", (event) => {
        if (event.altKey && event.key.toLowerCase() === "r") {
            event.preventDefault();
            toggleRightSidebar();
        }
    });
})();
```

```md
| [CloudSchool 好用的鍵盤快速鍵集合](https://github.com/dq042000/TampermonkeyUserscripts/blob/main/src/CloudschoolHotkeys.user.js) | 按下 Alt+R 快速切換 Issue 側邊欄。 |
| [GitLab Sidebar Hotkey](https://github.com/dq042000/TampermonkeyUserscripts/blob/main/src/GitLabSidebarHotkey.user.js) | 按下 Ctrl+B 快速切換 GitLab 左側 sidebar。 |
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && node --test tests/gitlabSidebarHotkey.test.js`
Expected: PASS with the metadata regression test included.

### Task 4: 執行驗證

**Files:**
- Verify: `tests/gitlabSidebarHotkey.test.js`
- Verify: `src/GitLabSidebarHotkey.user.js`
- Verify: `src/CloudschoolHotkeys.user.js`
- Verify: `README.md`

- [ ] **Step 1: Run the full automated test suite**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && npm test`
Expected: PASS with all `node:test` cases green.

- [ ] **Step 2: Perform manual browser verification**

Run these checks in Tampermonkey:

```text
1. 在 gitlab.com 任一專案頁面按 Ctrl+B，左側 sidebar 會切換。
2. 在自架 GitLab 頁面按 Ctrl+B，若頁面存在 Collapse/Expand sidebar 控制，左側 sidebar 會切換。
3. 在 GitLab 搜尋欄、issue 描述編輯器或 comment 編輯器內按 Ctrl+B，不會觸發腳本。
4. 在 gitlab.cloudschool.com.tw issue 頁面按 Alt+R，右側 issue sidebar 仍會切換。
```

- [ ] **Step 3: Check the git diff for unintended changes**

Run: `cd /home/dq042000/web/temp/TampermonkeyUserscripts && git --no-pager diff -- src/ README.md package.json tests/ docs/superpowers/plans/2026-03-27-gitlab-sidebar-hotkey.md docs/superpowers/specs/2026-03-27-gitlab-sidebar-hotkey-design.md`
Expected: Only the planned files and intended changes are present.