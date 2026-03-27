// ==UserScript==
// @name         CloudSchool 好用的鍵盤快速鍵集合
// @version      1.3.0
// @description  按下 Alt+R 快速切換 Issue 側邊欄。
// @namespace    https://gitlab.cloudschool.com.tw/tampermonkey/sidebar
// @source       https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/CloudschoolHotkeys.user.js
// @namespace    https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/CloudschoolHotkeys.user.js
// @match        https://gitlab.cloudschool.com.tw/*/*
// @author       Mike Ci
// @icon         https://www.cloudschool.tw/stern-web/img/favicon.ico
// ==/UserScript==

(function () {
  "use strict";

  function isProjectPage() {
    const path = location.pathname.split("/").filter(Boolean);
    return path.length >= 2;
  }

  if (!isProjectPage()) {
    return;
  }

  /* =========================
   * 右側 Issue Sidebar（Alt + R）
   * ========================= */
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
      // 收合
      layout.classList.remove("right-sidebar-expanded");
      layout.classList.add("right-sidebar-collapsed");

      aside.className =
        "right-sidebar js-right-sidebar js-issuable-sidebar right-sidebar-collapsed";

      expandIcon && expandIcon.classList.remove("hidden");

      collapseIcon && collapseIcon.classList.add("hidden");
    } else {
      // 展開
      layout.classList.remove("right-sidebar-collapsed");
      layout.classList.add("right-sidebar-expanded");

      aside.className =
        "right-sidebar js-right-sidebar js-issuable-sidebar right-sidebar-expanded";

      expandIcon && expandIcon.classList.add("hidden");

      collapseIcon && collapseIcon.classList.remove("hidden");
    }
  }

  /* =========================
   * 綁定按鈕（SPA）
   * ========================= */
  function bindButtons() {
    // 右側（issue）
    const rightBtn = document.querySelector(
      'a[aria-label="Toggle sidebar"].js-sidebar-toggle'
    );
    if (rightBtn && !rightBtn.dataset.tmBoundRight) {
      rightBtn.dataset.tmBoundRight = "1";
      rightBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleRightSidebar();
      });
    }
  }

  const observer = new MutationObserver(bindButtons);
  observer.observe(document.body, { childList: true, subtree: true });

  /* =========================
   * 快速鍵
   * ========================= */
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "r") {
      e.preventDefault();
      toggleRightSidebar();
    }
  });
})();
