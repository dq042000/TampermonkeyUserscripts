const test = require("node:test");
const assert = require("node:assert/strict");

const {
  matchesSidebarHotkey,
  matchesDeleteHotkey,
  isEditableElement,
  isSidebarToggleTrigger,
  isOptionsButtonTrigger,
  findSidebarToggleElement,
  findOptionsButton,
  findDeleteMenuItem,
  findDeleteConfirmButton,
  waitForElement
} = require("../src/lib/chatGptHotkeys");

test("matchesSidebarHotkey accepts Ctrl+B without extra modifiers", () => {
  assert.equal(
    matchesSidebarHotkey({
      key: "b",
      code: "KeyB",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false
    }),
    true
  );

  assert.equal(
    matchesSidebarHotkey({
      key: "b",
      code: "KeyB",
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false
    }),
    false,
    "Ctrl+Alt+B should not match"
  );

  assert.equal(
    matchesSidebarHotkey({
      key: "b",
      code: "KeyB",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false
    }),
    false,
    "plain B should not match"
  );
});

test("matchesDeleteHotkey accepts Ctrl+Delete without extra modifiers", () => {
  assert.equal(
    matchesDeleteHotkey({
      key: "Delete",
      code: "Delete",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false
    }),
    true
  );

  assert.equal(
    matchesDeleteHotkey({
      key: "Delete",
      code: "Delete",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false
    }),
    false,
    "plain Delete should not match"
  );

  assert.equal(
    matchesDeleteHotkey({
      key: "Delete",
      code: "Delete",
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false
    }),
    false,
    "Ctrl+Shift+Delete should not match"
  );

  assert.equal(
    matchesDeleteHotkey({
      key: "Delete",
      code: "Delete",
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false
    }),
    false,
    "Ctrl+Alt+Delete should not match"
  );
});

test("isEditableElement returns true for editable controls", () => {
  assert.equal(isEditableElement({ tagName: "INPUT" }), true);
  assert.equal(isEditableElement({ tagName: "TEXTAREA" }), true);
  assert.equal(isEditableElement({ tagName: "SELECT" }), true);
  assert.equal(
    isEditableElement({
      tagName: "DIV",
      isContentEditable: true,
      closest: () => null
    }),
    true
  );
  assert.equal(isEditableElement(null), false);
  assert.equal(
    isEditableElement({
      tagName: "BUTTON",
      isContentEditable: false,
      closest: () => null
    }),
    false
  );
});

test("isSidebarToggleTrigger matches sidebar labels", () => {
  const cases = [
    { ariaLabel: "Close sidebar", expected: true },
    { ariaLabel: "Open sidebar", expected: true },
    { ariaLabel: "Toggle sidebar", expected: true },
    { ariaLabel: "Collapse sidebar", expected: true },
    { ariaLabel: "Expand sidebar", expected: true },
    { ariaLabel: "Show sidebar", expected: true },
    { ariaLabel: "Hide sidebar", expected: true },
    { ariaLabel: "開啟側邊欄", expected: true },
    { ariaLabel: "關閉側邊欄", expected: true },
    { ariaLabel: "Submit", expected: false },
    { ariaLabel: "Open menu", expected: false }
  ];

  for (const { ariaLabel, expected } of cases) {
    assert.equal(
      isSidebarToggleTrigger({
        ariaLabel,
        title: "",
        textContent: "",
        dataset: {}
      }),
      expected,
      `Expected ${expected} for ariaLabel="${ariaLabel}"`
    );
  }
});

test("isOptionsButtonTrigger matches options button labels", () => {
  const cases = [
    { ariaLabel: "Chat options", expected: true },
    { ariaLabel: "More options", expected: true },
    { ariaLabel: "Conversation options", expected: true },
    { ariaLabel: "Chat controls", expected: true },
    { ariaLabel: "Send message", expected: false },
    { ariaLabel: "New chat", expected: false }
  ];

  for (const { ariaLabel, expected } of cases) {
    assert.equal(
      isOptionsButtonTrigger({
        ariaLabel,
        title: "",
        textContent: "",
        dataset: {}
      }),
      expected,
      `Expected ${expected} for ariaLabel="${ariaLabel}"`
    );
  }
});

test("findSidebarToggleElement uses known selector when available", () => {
  const toggleEl = { tagName: "BUTTON", closest: () => null };

  const doc = {
    querySelector(selector) {
      return selector === 'button[aria-label="開啟側邊欄"]' ? toggleEl : null;
    },
    querySelectorAll: () => []
  };

  assert.equal(findSidebarToggleElement(doc), toggleEl);
});

test("findSidebarToggleElement skips elements inside inert container", () => {
  const inertEl = { tagName: "BUTTON", closest: (sel) => (sel === "[inert]" ? {} : null) };
  const visibleEl = { tagName: "BUTTON", closest: () => null };

  const doc = {
    querySelector(selector) {
      if (selector === 'button[aria-label="開啟側邊欄"]') return inertEl;
      if (selector === 'button[aria-label="關閉側邊欄"]') return visibleEl;
      return null;
    },
    querySelectorAll: () => []
  };

  assert.equal(findSidebarToggleElement(doc), visibleEl);
});

test("findSidebarToggleElement falls back to attribute scan", () => {
  const matchingButton = {
    tagName: "BUTTON",
    getAttribute: (name) => (name === "aria-label" ? "Toggle sidebar" : ""),
    textContent: "",
    dataset: {},
    closest: () => null
  };

  const doc = {
    querySelector: () => null,
    querySelectorAll: () => [
      {
        tagName: "BUTTON",
        getAttribute: () => "Submit",
        textContent: "",
        dataset: {},
        closest: () => null
      },
      matchingButton
    ]
  };

  assert.equal(findSidebarToggleElement(doc), matchingButton);
});

test("findSidebarToggleElement returns null when no toggle found", () => {
  const doc = {
    querySelector: () => null,
    querySelectorAll: () => [
      {
        tagName: "BUTTON",
        getAttribute: () => "Submit",
        textContent: "",
        dataset: {},
        closest: () => null
      }
    ]
  };

  assert.equal(findSidebarToggleElement(doc), null);
});

test("findOptionsButton uses known selector when available", () => {
  const optionsEl = { tagName: "BUTTON" };

  const doc = {
    querySelector(selector) {
      return selector === 'button[aria-label="Chat options"]'
        ? optionsEl
        : null;
    },
    querySelectorAll: () => []
  };

  assert.equal(findOptionsButton(doc), optionsEl);
});

test("findOptionsButton falls back to attribute scan", () => {
  const matchingButton = {
    tagName: "BUTTON",
    getAttribute: (name) => (name === "aria-label" ? "More options" : ""),
    textContent: "",
    dataset: {}
  };

  const doc = {
    querySelector: () => null,
    querySelectorAll: () => [
      {
        tagName: "BUTTON",
        getAttribute: () => "Send",
        textContent: "",
        dataset: {}
      },
      matchingButton
    ]
  };

  assert.equal(findOptionsButton(doc), matchingButton);
});

test("findDeleteMenuItem uses known selector when available", () => {
  const menuItem = { tagName: "LI" };

  const doc = {
    querySelector(selector) {
      return selector === '[data-testid="delete-chat-menu-item"]'
        ? menuItem
        : null;
    },
    querySelectorAll: () => []
  };

  assert.equal(findDeleteMenuItem(doc), menuItem);
});

test("findDeleteMenuItem falls back to textContent match", () => {
  const deleteItem = {
    tagName: "LI",
    getAttribute: () => null,
    textContent: "Delete",
    dataset: {}
  };

  const doc = {
    querySelector: () => null,
    querySelectorAll: (selector) => {
      if (selector === '[role="menuitem"], [role="option"]') {
        return [
          {
            tagName: "LI",
            getAttribute: () => null,
            textContent: "Rename",
            dataset: {}
          },
          deleteItem
        ];
      }
      return [];
    }
  };

  assert.equal(findDeleteMenuItem(doc), deleteItem);
});

test("findDeleteMenuItem returns null when not found", () => {
  const doc = {
    querySelector: () => null,
    querySelectorAll: () => [
      {
        tagName: "LI",
        getAttribute: () => null,
        textContent: "Rename",
        dataset: {}
      }
    ]
  };

  assert.equal(findDeleteMenuItem(doc), null);
});

test("findDeleteConfirmButton uses known selector when available", () => {
  const confirmBtn = { tagName: "BUTTON" };

  const doc = {
    querySelector(selector) {
      return selector ===
        '[data-testid="delete-conversation-confirm-button"]'
        ? confirmBtn
        : null;
    },
    querySelectorAll: () => []
  };

  assert.equal(findDeleteConfirmButton(doc), confirmBtn);
});

test("findDeleteConfirmButton falls back to dialog button text match", () => {
  const deleteBtn = {
    tagName: "BUTTON",
    getAttribute: () => null,
    textContent: "Delete",
    dataset: {}
  };

  const doc = {
    querySelector: () => null,
    querySelectorAll: (selector) => {
      if (
        selector ===
        'dialog button, [role="dialog"] button, [role="alertdialog"] button'
      ) {
        return [
          {
            tagName: "BUTTON",
            getAttribute: () => null,
            textContent: "Cancel",
            dataset: {}
          },
          deleteBtn
        ];
      }
      return [];
    }
  };

  assert.equal(findDeleteConfirmButton(doc), deleteBtn);
});

test("waitForElement resolves immediately when element already exists", async () => {
  const el = { tagName: "DIV" };
  const doc = { querySelector: () => el, body: {} };

  const result = await waitForElement(doc, "div", 1000);
  assert.equal(result, el);
});

test("waitForElement resolves null on timeout when element never appears", async () => {
  const doc = {
    querySelector: () => null,
    body: {
      _observers: [],
      addEventListener() {}
    }
  };

  const MutationObserverOrig = global.MutationObserver;
  global.MutationObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
  };

  const result = await waitForElement(doc, "div", 50);
  assert.equal(result, null);

  global.MutationObserver = MutationObserverOrig;
});
