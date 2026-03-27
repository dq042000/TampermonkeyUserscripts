const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");

const {
  findSidebarToggleElement,
  isLikelyGitLabPage,
  isEditableElement,
  matchesToggleHotkey,
  isSidebarToggleTrigger
} = require("../src/lib/gitlabSidebarHotkey");

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
});

test("isSidebarToggleTrigger matches collapse and expand labels", () => {
  assert.equal(
    isSidebarToggleTrigger({
      ariaLabel: "Collapse sidebar",
      title: "",
      textContent: "",
      dataset: {}
    }),
    true
  );

  assert.equal(
    isSidebarToggleTrigger({
      ariaLabel: "Expand sidebar",
      title: "",
      textContent: "",
      dataset: {}
    }),
    true
  );

  assert.equal(
    isSidebarToggleTrigger({
      ariaLabel: "Open shortcuts",
      title: "",
      textContent: "",
      dataset: {}
    }),
    false
  );
});

test("findSidebarToggleElement returns the first matching control", () => {
  const matchingButton = {
    tagName: "BUTTON",
    getAttribute(name) {
      return name === "aria-label" ? "Collapse sidebar" : "";
    },
    textContent: "",
    dataset: {}
  };

  const documentStub = {
    querySelectorAll() {
      return [
        {
          tagName: "BUTTON",
          getAttribute: () => "Open shortcuts",
          textContent: "",
          dataset: {}
        },
        matchingButton
      ];
    }
  };

  assert.equal(findSidebarToggleElement(documentStub), matchingButton);
});

test("isLikelyGitLabPage detects GitLab metadata and rejects non-GitLab pages", () => {
  const gitlabDocument = {
    querySelector(selector) {
      if (selector === 'meta[name="application-name"]') {
        return {
          getAttribute(name) {
            return name === "content" ? "GitLab" : "";
          }
        };
      }

      return null;
    }
  };

  const otherDocument = {
    querySelector() {
      return null;
    }
  };

  assert.equal(isLikelyGitLabPage(gitlabDocument), true);
  assert.equal(isLikelyGitLabPage(otherDocument), false);
});

test("cloudschool script description no longer mentions Ctrl+B", async () => {
  const source = await fs.readFile("src/CloudschoolHotkeys.user.js", "utf8");

  assert.equal(source.includes("Ctrl+B"), false);
});
