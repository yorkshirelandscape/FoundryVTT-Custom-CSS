/**
 * The top pane's share of a split container for a pointer at `y`, kept between `min` and 1 - `min`.
 *
 * @param {number} y - Pointer position (client px)
 * @param {{top: number, height: number}} box - The container's rect, minus the separator's height
 * @param {number} [min=0.1] - Smallest share either pane may have
 * @returns {number}
 */
export function splitAt(y, { top, height }, min = 0.1) {
    if (!(height > 0)) return 0.5;
    return clampSplit((y - top) / height, min);
}

/** @returns {number} `split` kept between `min` and 1 - `min` (0.5 if not a number) */
export function clampSplit(split, min = 0.1) {
    if (!Number.isFinite(split)) return 0.5;
    return Math.min(1 - min, Math.max(min, split));
}

/**
 * Make a separator resize the panes on either side of it: drag, arrow keys, double-click to reset.
 * The split is written to `--ccss-split` on the container, which its grid rows read.
 *
 * @param {HTMLElement} container - Grid container holding the two panes and the separator
 * @param {HTMLElement} separator - The handle between the panes
 * @param {object} options
 * @param {number} options.split - Starting share of the top pane
 * @param {(split: number) => void} [options.onChange] - Called once a drag or key press settles
 */
export function makeSplitter(container, separator, { split, onChange = () => {} }) {
    const set = value => {
        split = clampSplit(value);
        container.style.setProperty("--ccss-split", String(split));
        separator.setAttribute("aria-valuenow", String(Math.round(split * 100)));
    };
    set(split);

    const box = () => {
        const r = container.getBoundingClientRect();
        return { top: r.top, height: r.height - separator.offsetHeight };
    };

    let frame = null;
    separator.addEventListener("pointerdown", event => {
        if (event.button !== 0) return;
        event.preventDefault();
        separator.setPointerCapture(event.pointerId);
        container.classList.add("ccss-dragging");
        const grab = event.clientY - separator.getBoundingClientRect().top;
        const move = e => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                set(splitAt(e.clientY - grab, box()));
            });
        };
        const end = () => {
            separator.removeEventListener("pointermove", move);
            container.classList.remove("ccss-dragging");
            onChange(split);
        };
        separator.addEventListener("pointermove", move);
        separator.addEventListener("lostpointercapture", end, { once: true });
    });

    separator.addEventListener("dblclick", () => { set(0.5); onChange(split); });

    separator.addEventListener("keydown", event => {
        const step = event.shiftKey ? 0.1 : 0.02;
        const next = { ArrowUp: split - step, ArrowDown: split + step, Home: 0, End: 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        set(next);
        onChange(split);
    });
}
