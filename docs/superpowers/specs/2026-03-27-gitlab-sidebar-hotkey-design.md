---
post_title: GitLab Sidebar Hotkey Design
author1: GitHub Copilot
microsoft_alias: unknown
post_slug: gitlab-sidebar-hotkey-design
featured_image: https://www.google.com/s2/favicons?domain=gitlab.com
categories: [general]
tags: [tampermonkey, userscript, gitlab, hotkey]
ai_note: yes
summary: 通用 GitLab 側邊欄快捷鍵 userscript 的設計說明，包含相容性策略、檔案調整範圍與驗證方式。
post_date: 2026-03-27
---

## 背景

目前專案已有一支只套用在 CloudSchool GitLab 的腳本，提供左側
sidebar 的 Ctrl+B 與右側 issue sidebar 的 Alt+R。新需求是把左側
sidebar 的 Ctrl+B 抽成適用於所有 GitLab 網站的共用版本，同時避免
與 CloudSchool 腳本在同一站點重複攔截相同快捷鍵。

## 目標

- 新增一支獨立 userscript，提供所有 GitLab 網站共用的 Ctrl+B 左側
  sidebar 切換。
- 當焦點位於可編輯區域時，不攔截 Ctrl+B。
- 以點擊 GitLab 既有 sidebar 切換按鈕為主，不直接操作版面 class。
- 保留 CloudSchool 腳本中的 Alt+R 功能，並移除其左側 Ctrl+B。
- 更新 README，說明新的腳本分工與快捷鍵。

## 非目標

- 不處理右側 issue sidebar 的通用化。
- 不實作以 class 操作版面狀態的 fallback。
- 不保證所有完全客製化 UI 的 GitLab 衍生介面皆可支援。

## 設計概要

### 腳本切分

新增一支 GitLab 通用腳本，專責左側 sidebar 的 Ctrl+B。CloudSchool
腳本只保留該站特有的 Alt+R 邏輯，避免在 CloudSchool 網站上兩支腳本
同時攔截 Ctrl+B。

### 快捷鍵行為

腳本監聽 Ctrl+B。若事件目標或目前焦點落在以下任一類型，則不執行：

- input
- textarea
- select
- 具有 contenteditable 的元素
- 常見富文字編輯器容器或其子元素

若不在可編輯情境，腳本會阻止預設行為並嘗試尋找 GitLab 左側 sidebar
切換按鈕。

### 相容性策略

不同 GitLab 版本的 DOM 結構可能不同，因此腳本不依賴單一固定 class
名稱，而是優先用按鈕語意資訊尋找切換控制項，例如：

- aria-label
- title
- data-testid
- 按鈕文字中的 Collapse sidebar 或 Expand sidebar

腳本會用多組選擇器與文字比對組合出保守的查找策略，並在找到可互動的
button 或 link 後直接 click。這樣能沿用 GitLab 內建的收合狀態更新與
事件處理，降低跨版本破壞風險。

### 失敗處理

若找不到 sidebar 切換按鈕，腳本不做 DOM 強制切換，只安全地略過，必要
時在 console 輸出簡短訊息以利後續調整。此決策優先考慮版面一致性與維護
成本，而不是不可靠的強制 fallback。

## 檔案調整

預計變更如下：

1. 新增一支 GitLab 通用 userscript。
2. 修改 CloudSchool 腳本，移除左側 Ctrl+B 與相關說明，只保留 Alt+R。
3. 更新 README 的腳本列表與快捷鍵說明。

## 測試與驗證

### 行為驗證

- 確認 Ctrl+B 在一般頁面可切換左側 sidebar。
- 確認 sidebar 已收合與已展開狀態都能切換。
- 確認在 input、textarea、contenteditable 等可編輯區域不會攔截。
- 確認 CloudSchool 網站上 Alt+R 仍維持原有功能。

### 風險

- GitLab 自架版本可能在 aria-label、title 或按鈕文字上使用不同語系。
- GitLab 未來若重構 sidebar 控制項，可能需要補充選擇器或文字條件。

## 實作原則

- 優先維持腳本簡單與單一職責。
- 儘量沿用現有專案在 userscript 中的事件監聽與小型 helper 風格。
- 只做本次需求需要的最小變更，不擴大成完整 GitLab 快捷鍵套件。