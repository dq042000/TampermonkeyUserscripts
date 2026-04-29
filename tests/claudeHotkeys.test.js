const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findSidebarToggleElement,
  findSettingsElement,
  isEditableElement,
  isSidebarToggleTrigger,
  matchesSidebarHotkey,
  matchesSettingsHotkey
} = require("../src/lib/claudeHotkeys");

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

test("matchesSettingsHotkey accepts Alt+S without extra modifiers", () => {
  assert.equal(
    matchesSettingsHotkey({
      key: "s",
      code: "KeyS",
      altKey: true,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false
    }),
    true
  );

  assert.equal(
    matchesSettingsHotkey({
      key: "s",
      code: "KeyS",
      altKey: true,
      ctrlKey: true,
      shiftKey: false,
      metaKey: false
    }),
    false,
    "Ctrl+Alt+S should not match"
  );

  assert.equal(
    matchesSettingsHotkey({
      key: "s",
      code: "KeyS",
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false
    }),
    false,
    "plain S should not match"
  );
});

test("isEditableElement returns true for editable controls", () => {
  assert.equal(isEditableElement({ tagName: "INPUT" }), true);
  assert.equal(isEditableElement({ tagName: "TEXTAREA" }), true);
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
    isEditableElement({ tagName: "BUTTON", isContentEditable: false, closest: () => null }),
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
    { ariaLabel: "Submit", expected: false },
    { ariaLabel: "Open menu", expected: false }
  ];

  for (const { ariaLabel, expected } of cases) {
    assert.equal(
      isSidebarToggleTrigger({ ariaLabel, title: "", textContent: "", dataset: {} }),
      expected,
      `Expected ${expected} for ariaLabel="${ariaLabel}"`
    );
  }
});

test("isSidebarToggleTrigger also matches via title and textContent", () => {
  assert.equal(
    isSidebarToggleTrigger({ ariaLabel: "", title: "Close sidebar", textContent: "", dataset: {} }),
    true
  );
  assert.equal(
    isSidebarToggleTrigger({ ariaLabel: "", title: "", textContent: "Toggle sidebar", dataset: {} }),
    true
  );
});

test("findSidebarToggleElement uses known selector when available", () => {
  const toggleEl = { tagName: "BUTTON" };

  const doc = {
    querySelector(selector) {
      return selector === '[aria-label="Close sidebar"]' ? toggleEl : null;
    },
    querySelectorAll: () => []
  };

  assert.equal(findSidebarToggleElement(doc), toggleEl);
});

test("findSidebarToggleElement falls back to attribute scan", () => {
  const matchingButton = {
    tagName: "BUTTON",
    getAttribute: (name) => (name === "aria-label" ? "Toggle sidebar" : ""),
    textContent: "",
    dataset: {}
  };

  const doc = {
    querySelector: () => null,
    querySelectorAll: () => [
      { tagName: "BUTTON", getAttribute: () => "Submit", textContent: "", dataset: {} },
      matchingButton
    ]
  };

  assert.equal(findSidebarToggleElement(doc), matchingButton);
});

test("findSidebarToggleElement returns null when no toggle found", () => {
  const doc = {
    querySelector: () => null,
    querySelectorAll: () => [
      { tagName: "BUTTON", getAttribute: () => "Submit", textContent: "", dataset: {} }
    ]
  };

  assert.equal(findSidebarToggleElement(doc), null);
});

test("findSettingsElement returns settings link when present", () => {
  const link = { tagName: "A" };

  const doc = {
    querySelector(selector) {
      return selector === 'a[href="/settings"]' ? link : null;
    }
  };

  assert.equal(findSettingsElement(doc), link);
});

test("findSettingsElement returns null when no settings element found", () => {
  const doc = { querySelector: () => null };

  assert.equal(findSettingsElement(doc), null);
});
