# Live checks

Run against a Foundry world with Custom CSS active. These open the editor and measure it; they never submit the form, so no stylesheet is changed.

- `run-in-world.cjs <url> <cookie-jar> <page-script> [screenshot]`: opens `/game` with a logged-in session (a Netscape-format cookie jar) and runs the page script there, printing its result as JSON. `MODULE_DIRS="custom-css=<checkout>"` serves the module from a local checkout instead of the server's install. Needs `playwright` and Chromium (`CHROMIUM` to override its path).
- `probe.page.js`: is the module active, which version, how long the stylesheets are.
- `editor.page.js`: opens the editor and reports pane, separator and footer boxes; with `window.CC_DRAG = true` prepended, also drags the separator.
