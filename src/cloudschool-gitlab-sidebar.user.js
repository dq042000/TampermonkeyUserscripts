// ==UserScript==
// @name         CloudSchool GitLab Sidebar Toggle
// @namespace    https://gitlab.cloudschool.com.tw/tampermonkey/sidebar
// @version      1.1.0
// @description  CloudSchool GitLab 專案頁左側 menu 縮放（Alt + E）
// @match        https://gitlab.cloudschool.com.tw/*/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    /**
     * 僅在「專案頁」執行
     * 避免作用在登入頁、群組首頁、個人設定
     */
    function isProjectPage() {
        const path = location.pathname.split("/").filter(Boolean);
        return path.length >= 2;
    }

    if (!isProjectPage()) {
        return;
    }

    const layoutPageSelector =
        "div.layout-page.hide-when-top-nav-responsive-open";

    const asideSelector = 'aside[aria-label="Project navigation"]';

    const topNavSelector =
        "div.top-nav-responsive.layout-page.content-wrapper-margin";

    function toggleSidebar() {
        const layoutPage = document.querySelector(layoutPageSelector);
        const aside = document.querySelector(asideSelector);
        const topNav = document.querySelector(topNavSelector);

        if (!layoutPage || !aside || !topNav) {
            return;
        }

        const isCollapsed = layoutPage.classList.contains(
            "page-with-icon-sidebar"
        );

        if (isCollapsed) {
            // 放大（還原）
            layoutPage.classList.remove("page-with-icon-sidebar");

            aside.className = "nav-sidebar";

            topNav.className =
                "top-nav-responsive layout-page content-wrapper-margin";
        } else {
            // 縮小
            layoutPage.classList.add("page-with-icon-sidebar");

            aside.className =
                "nav-sidebar sidebar-collapsed-desktop js-sidebar-collapsed";

            topNav.className =
                "top-nav-responsive layout-page content-wrapper-margin page-with-icon-sidebar";
        }
    }

    function bindToggleButton() {
        const btn = document.querySelector(
            "a.toggle-sidebar-button.js-toggle-sidebar.qa-toggle-sidebar.rspec-toggle-sidebar"
        );

        if (!btn || btn.dataset.tmBound === "1") {
            return false;
        }

        btn.dataset.tmBound = "1";

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            toggleSidebar();
        });

        return true;
    }

    // SPA：等待 GitLab 專案頁 DOM 出現
    const observer = new MutationObserver(() => {
        bindToggleButton();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Alt + E 快速鍵
    document.addEventListener("keydown", (e) => {
        if (e.altKey && e.key.toLowerCase() === "e") {
            e.preventDefault();
            toggleSidebar();
        }
    });
})();
