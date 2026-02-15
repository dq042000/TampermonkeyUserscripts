// ==UserScript==
// @name         GitHub Stars 回到最上層
// @version      1.0.0
// @description  在 GitHub stars 換頁後快速回到頁面頂端，並顯示「回到最上層」按鈕
// @namespace    https://github.com/dq042000/TampermonkeyUserscripts
// @source       https://github.com/dq042000/TampermonkeyUserscripts/raw/main/src/GithubStarsBackToTop.user.js
// @match        https://github.com/*
// @author       Mike Ci
// @icon         https://www.google.com/s2/favicons?domain=github.com
// ==/UserScript==

(function () {
    "use strict";

    const SCROLL_OPTIONS = { top: 0, behavior: "smooth" };
    let btn = null;

    function scrollToTopInstant() {
        window.scrollTo(0, 0);
    }

    function scrollToTopSmooth() {
        try {
            window.scrollTo(SCROLL_OPTIONS);
        } catch (e) {
            scrollToTopInstant();
        }
    }

    function findStarredHeading() {
        const candidates = Array.from(document.querySelectorAll("h1,h2,h3"));
        return candidates.find((el) =>
            /Starred repositories/i.test(el.textContent.trim()),
        );
    }

    function scrollToHeadingSmooth() {
        const heading = findStarredHeading();
        if (heading) {
            try {
                heading.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            } catch (e) {}
        }
        try {
            window.scrollTo(SCROLL_OPTIONS);
        } catch (e) {
            scrollToTopInstant();
        }
    }

    function ensureButton() {
        if (btn) return;
        btn = document.createElement("button");
        btn.textContent = "回到最上層";
        Object.assign(btn.style, {
            position: "fixed",
            right: "16px",
            bottom: "16px",
            zIndex: 9999,
            padding: "8px 12px",
            borderRadius: "6px",
            background: "#2ea44f",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            fontSize: "13px",
        });
        btn.addEventListener("click", scrollToTopSmooth);
        document.body.appendChild(btn);

        // 初始隱藏，向下捲動超過 200px 會顯示
        btn.style.display = "none";
        window.addEventListener(
            "scroll",
            () => {
                btn.style.display = window.scrollY > 200 ? "" : "none";
            },
            { passive: true },
        );
    }

    // 保留：當點擊「上一頁 / 下一頁」連結時，在導航完成後捲到 Starred repositories 標題
    document.addEventListener(
        "click",
        (e) => {
            const a = e.target.closest && e.target.closest("a");
            if (!a) return;
            const inPagination = a.closest(
                '.paginate-container, .pagination, [aria-label="Pagination"]',
            );
            if (!inPagination) return;

            const rel = (a.getAttribute("rel") || "").toLowerCase();
            const ariaLabel = (
                a.getAttribute("aria-label") || ""
            ).toLowerCase();
            const linkText = (a.textContent || "").trim().toLowerCase();
            const isPagerNav =
                rel === "next" ||
                rel === "prev" ||
                ariaLabel.includes("next") ||
                ariaLabel.includes("previous") ||
                ariaLabel.includes("prev") ||
                ariaLabel.includes("下一") ||
                ariaLabel.includes("上一") ||
                linkText === "next" ||
                linkText === "previous" ||
                linkText === "prev" ||
                linkText === "下一頁" ||
                linkText === "上一頁";
            if (!isPagerNav) return;
            if (window.getSelection && window.getSelection().toString()) return;

            let fallbackTimer = null;
            let handled = false;
            const onPjax = () => {
                if (handled) return;
                handled = true;
                if (fallbackTimer) {
                    clearTimeout(fallbackTimer);
                    fallbackTimer = null;
                }
                try {
                    scrollToHeadingSmooth();
                } catch (e) {}
                ensureButton();
                window.removeEventListener("pjax:end", onPjax);
                window.removeEventListener("pjax:success", onPjax);
                window.removeEventListener("turbo:load", onPjax);
            };
            window.addEventListener("pjax:end", onPjax);
            window.addEventListener("pjax:success", onPjax);
            window.addEventListener("turbo:load", onPjax);

            // fallback: 若 PJAX 在指定時間內未觸發，則執行捲動
            fallbackTimer = setTimeout(() => {
                if (handled) return;
                handled = true;
                try {
                    scrollToHeadingSmooth();
                } catch (e) {}
                ensureButton();
                window.removeEventListener("pjax:end", onPjax);
                window.removeEventListener("pjax:success", onPjax);
                window.removeEventListener("turbo:load", onPjax);
                fallbackTimer = null;
            }, 1200);
        },
        true,
    );

    // 首次載入如在 stars 頁面則建立按鈕
    if (/(\?tab=stars|\/stars)/.test(location.href)) ensureButton();
})();
