import { Settings } from './settings.js';

const { ApplicationV2, HandleBarsApplicationMixin } = foundry.applications.api;

/**
 * A form for inputting Custom CSS settings.
 *
 * @export
 * @class CcssEditor
 * @extends {HandleBarsApplicationMixin(ApplicationV2)}
 */
export class CcssEditor extends HandleBarsApplicationMixin(ApplicationV2) {
    /**
     * Track dirty state for the form.
     */
    _dirty = false;

    /**
     * Override close to handle dirty state: prompt if dirty, else close.
     */
    async close(options) {
        if (this._dirty) {
            const { DialogV2 } = foundry.applications.api;
            const proceed = await DialogV2.confirm({
                content: game.i18n.localize("CCSS.settings.unsavedChangesPrompt") || "You have unsaved changes. Save before closing?",
                rejectClose: false,
                modal: true
            });
            if (proceed) {
                await this._submitFormAndReset(false); // Save and close
            } // else discard changes
        }
        return super.close(options);
    }

    /**
     * Helper to submit the form and reset dirty state.
     * @param {boolean} keepOpen - If true, do not close the window.
     */
    async _submitFormAndReset(keepOpen = true) {
        const form = this.element[0]?.querySelector('form');
        if (form) {
            const formData = {};
            const fd = new FormData(form);
            for (const [key, value] of fd.entries()) {
                formData[key] = value;
            }
            await this.constructor.ccssFormHandler.call(this, null, form, formData);
            this._dirty = false;
            if (!keepOpen) await super.close();
        }
    }
    static DEFAULT_OPTIONS = {
        id: "ccss-settings-form",
        classes: ["sheet", "ccssEditor"],
        tag: "form",
        form: {
            handler: CcssEditor.ccssFormHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        window: {
            title: game.i18n.localize("CCSS.settings.settingsMenu.title"),
            resizable: true,
            width: 500
        }
        // AppV1 options for reference
        // submitOnClose: true,
    }

    get windowOptions() {
        return {
            ...super.windowOptions,
            height: game.user.isGM ? 900 : 500
        };
    }



    static PARTS = {
        stylesheet: {
            template: "modules/custom-css/templates/settings.html",
        },
        footer: {
            template: "templates/generic/form-footer.hbs",
        }
    }


     /**
     * Process form submission for the sheet
     * @this {CcssEditor}                      The handler is called with the application as its bound scope
     * @param {SubmitEvent} event                   The originating form submission event
     * @param {HTMLFormElement} form                The form element that was submitted
     * @param {FormDataExtended} formData           Processed data for the submitted form
     * @returns {Promise<void>}
     */
    static async ccssFormHandler(event, form, formData) {
        // Save code editor content if needed
        if (this.codeEditors && Array.isArray(this.codeEditors)) {
            this.codeEditors.forEach(editor => {
                if (editor && typeof editor.save === "function") editor.save();
            });
        }
        // Update settings with form data
        await Settings.updateStylesheets(formData["stylesheet"], formData["userStylesheet"]);
    }

    


    codeEditors = [];

    /**
     * Construct an object of data to be passed to this froms HTML template.
     *
     * @param {string} partId - The part being rendered
     * @param {ApplicationRenderContext} context - The shared context provided by _prepareContext
     * @returns {Promise<ApplicationRenderContext>} Context data for the form part
     * @protected
     */
    _preparePartContext(partId, context) {
        context.partId = `${this.id}-${partId}`;
        context.isGM = game.user.isGM;
        context.stylesheet = Settings.getWorldStylesheet();
        context.userStylesheet = Settings.getUserStylesheet();
        context.buttons = [
            { type: "button", icon: "fas fa-check", label: "CCSS.settings.Apply", class: "apply" },
            { type: "button", icon: "fas fa-save", label: "CCSS.settings.Save", class: "save" }
        ];
        return context;
    }





    /**
     * Handles editor resizing.
     * 
     * @param {element} element - The drag handle element.
     * @param {string} direction - The direction of the drag handle.
     * @memberof CcssEditor
     */
    dragElement(element, direction) {
        var md;
        const first = document.getElementById("ccss-top");
        const second = document.getElementById("ccss-bottom");
        const splitter = document.getElementById("ccss-settings-form");
    
        element.onmousedown = onMouseDown;
    
        function onMouseDown(e) {
            md = {
                e,
                offsetLeft: element.offsetLeft,
                offsetTop: element.offsetTop,
                offsetBottom: element.offsetBottom,
                firstWidth: first.offsetWidth,
                secondWidth: second.offsetWidth,
                firstHeight: first.offsetHeight,
                secondHeight: (splitter.offsetHeight - first.offsetHeight)
            };
            document.onmousemove = onMouseMove;
    
            document.onmouseup = () => {
                document.onmousemove = document.onmouseup = null;
            }
        }
    
        function onMouseMove(e) {
    
            var delta = {
                x: e.clientX - md.e.x,
                y: e.clientY - md.e.y
            };
    
            if (direction === "H") {
                delta.x = Math.min(Math.max(delta.x, -md.firstWidth),
                    md.secondWidth);
                element.style.left = md.offsetLeft + delta.x + "px";
                first.style.width = (md.firstWidth + delta.x) + "px";
                second.style.width = (md.secondWidth - delta.x) + "px";
            }
    
            if (direction === "V") {
                delta.y = Math.min(Math.max(delta.y, -md.firstHeight), md.secondHeight);
                element.style.top = md.offsetTop + delta.y + "px";
                first.style.height = (md.firstHeight + delta.y) + "px";
                second.style.height = (md.secondHeight - delta.y) + "px";
            }
        }
    }

    /**
     * Activates all event listeners related to this form.
     *
     * @override Activates the CodeMirror code editor.
     *
     * @param {JQuery} html - The html content of the form.
     * @memberof CcssEditor
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Use the built-in HTMLCodeMirrorElement for code editors
        this.codeEditors = [];
        if (game.user.isGM) {
            const globalEditor = this.element[0]?.querySelector('#globalStylesheet');
            if (globalEditor instanceof HTMLCodeMirrorElement) {
                this.codeEditors.push(globalEditor);
            }
            this.dragElement(document.getElementById("ccss-sep"), "V");
        }
        const userEditor = this.element[0]?.querySelector('#userStylesheet');
        if (userEditor instanceof HTMLCodeMirrorElement) {
            this.codeEditors.push(userEditor);
        }

        // Track dirty state on input
        html.find('form').on('input change', () => { this._dirty = true; });

        // Apply button: submit without closing
        html.find('button.apply').on('click', async (ev) => {
            await this._submitFormAndReset(true);
        });
        // Save button: submit and close
        html.find('button.save').on('click', async (ev) => {
            await this._submitFormAndReset(false);
        });
    }
}
