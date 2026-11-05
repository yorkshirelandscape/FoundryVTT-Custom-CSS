import { test } from "node:test";
import assert from "node:assert/strict";
import { splitAt, clampSplit, makeSplitter } from "../splitter.js";

test("clampSplit keeps both panes at least min", () => {
    assert.equal(clampSplit(0.5), 0.5);
    assert.equal(clampSplit(0), 0.1);
    assert.equal(clampSplit(1), 0.9);
    assert.equal(clampSplit(0.02, 0.05), 0.05);
});

test("clampSplit falls back to 0.5 for non-numbers", () => {
    for (const v of [NaN, Infinity, undefined, null, "0.3"]) assert.equal(clampSplit(v), 0.5);
});

test("splitAt maps a pointer position to the top pane's share", () => {
    const box = { top: 100, height: 400 };
    assert.equal(splitAt(300, box), 0.5);
    assert.equal(splitAt(200, box), 0.25);
    assert.equal(splitAt(0, box), 0.1);     // above the container
    assert.equal(splitAt(900, box), 0.9);   // below it
    assert.equal(splitAt(300, { top: 0, height: 0 }), 0.5);
});

// Minimal stand-ins for the two elements makeSplitter touches
const fakeElement = () => Object.assign(new EventTarget(), {
    props: {},
    attrs: {},
    offsetHeight: 12,
    style: { setProperty(k, v) { this.owner.props[k] = v; } },
    classList: { add() {}, remove() {} },
    setAttribute(k, v) { this.attrs[k] = v; },
    getBoundingClientRect: () => ({ top: 0, height: 412 }),
});
const setup = split => {
    const container = fakeElement(), separator = fakeElement();
    container.style.owner = container;
    const changes = [];
    makeSplitter(container, separator, { split, onChange: s => changes.push(s) });
    const key = (k, shiftKey = false) => {
        const e = new Event("keydown", { cancelable: true });
        Object.assign(e, { key: k, shiftKey });
        separator.dispatchEvent(e);
        return e;
    };
    return { container, separator, changes, key };
};

test("makeSplitter writes fr rows and the ARIA value", () => {
    const { container, separator } = setup(0.3);
    assert.equal(container.props["--ccss-top"], "0.3fr");
    assert.equal(container.props["--ccss-bottom"], "0.7fr");
    assert.equal(separator.attrs["aria-valuenow"], "30");
});

test("makeSplitter clamps a remembered split", () => {
    const { container } = setup(0.99);
    assert.equal(container.props["--ccss-top"], "0.9fr");
});

test("arrow keys step the split, Shift for bigger steps; Home/End go to the limits", () => {
    const { changes, key } = setup(0.5);
    key("ArrowUp");
    key("ArrowDown", true);
    key("Home");
    key("End");
    assert.deepEqual(changes.map(s => +s.toFixed(2)), [0.48, 0.58, 0.1, 0.9]);
});

test("unrelated keys are left alone", () => {
    const { changes, key } = setup(0.5);
    const e = key("a");
    assert.equal(e.defaultPrevented, false);
    assert.deepEqual(changes, []);
});

test("double-click resets to an even split", () => {
    const { separator, changes } = setup(0.2);
    separator.dispatchEvent(new Event("dblclick"));
    assert.deepEqual(changes, [0.5]);
});
