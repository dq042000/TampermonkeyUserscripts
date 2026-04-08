const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findSidebarToggleElement,
  isEditableElement,
  isSidebarToggleTrigger,
  matchesToggleHotkey
} = require("../src/lib/githubCopilotSidebarHotkey");

test("matchesToggleHotkey accepts Ctrl+B without extra modifiers", () => {
  assert.equal(
    matchesToggleHotkey({
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
    matchesToggleHotkey({
      key: "b",
      code: "KeyB",
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false
    }),
    false
  );

  assert.equal(
    matchesToggleHotkey({
      key: "b",
      code: "KeyB",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false
    }),
    false
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
  assert.equal(isEditableElement({ tagName: "BUTTON", isContentEditable: false, closest: () => null }), false);
});

test("isSidebarToggleTrigger matches sidebar and conversation labels", () => {
  const cases = [
    { ariaLabel: "Toggle sidebar", expected: true },
    { ariaLabel: "Collapse sidebar", expected: true },
    { ariaLabel: "Expand sidebar", expected: true },
    { ariaLabel: "Show sidebar", expected: true },
    { ariaLabel: "Hide sidebar", expected: true },
    { ariaLabel: "Open sidebar", expected: true },
    { ariaLabel: "Close sidebar", expected: true },
    { ariaLabel: "Toggle conversation", expected: true },
    { ariaLabel: "Show conversations", expected: true },
    { ariaLabel: "Hide conversations", expected: true },
    { ariaLabel: "Submit", expected: false },
    { ariaLabel: "Open menu", expected: false }
  ];

  for (const { ariaLabel, expected } of cases) {
    assert.equal(
      isSidebarToggleTrigger({ ariaLabel, title: "", textContent: "", dataset: {} }),
      expected,
      `Expected isSidebarToggleTrigger to return ${expected} for ariaLabel="${ariaLabel}"`
    );
  }
});

test("isSidebarToggleTrigger also matches via title and textContent", () => {
  assert.equal(
    isSidebarToggleTrigger({ ariaLabel: "", title: "Collapse sidebar", textContent: "", dataset: {} }),
    true
  );

  assert.equal(
    isSidebarToggleTrigger({ ariaLabel: "", title: "", textContent: "Show sidebar", dataset: {} }),
    true
  );
});

test("findSidebarToggleElement returns the first matching control", () => {
  const matchingButton = {
    tagName: "BUTTON",
    getAttribute(name) {
      return name === "aria-label" ? "Toggle sidebar" : "";
    },
    textContent: "",
    dataset: {}
  };

  const documentStub = {
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [
        {
          tagName: "BUTTON",
          getAttribute: () => "Submit",
          textContent: "",
          dataset: {}
        },
        matchingButton
      ];
    }
  };

  assert.equal(findSidebarToggleElement(documentStub), matchingButton);
});

test("findSidebarToggleElement returns null when no toggle is found", () => {
  const documentStub = {
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [
        {
          tagName: "BUTTON",
          getAttribute: () => "Submit",
          textContent: "",
          dataset: {}
        }
      ];
    }
  };

  assert.equal(findSidebarToggleElement(documentStub), null);
});

test("findSidebarToggleElement uses known selector when available", () => {
  const toggleEl = { tagName: "BUTTON" };

  const documentStub = {
    querySelector(selector) {
      if (selector === '[aria-label="Toggle sidebar"]') return toggleEl;
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };

  assert.equal(findSidebarToggleElement(documentStub), toggleEl);
});
