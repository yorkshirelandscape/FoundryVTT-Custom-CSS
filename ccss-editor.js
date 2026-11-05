
import { Settings } from './settings.js';
import { makeSplitter } from './splitter.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// const { HTMLCodeMirrorElement } = foundry.applications.elements;

/**
 * A form for inputting Custom CSS settings.
 *
 * @export
 * @class CcssEditor
 * @extends {HandlebarsApplicationMixin(ApplicationV2)}
 */
export class CcssEditor extends HandlebarsApplicationMixin(ApplicationV2) {
    
    static DEFAULT_OPTIONS = {
        id: "ccss-settings-form",
        classes: ["sheet", "ccss-editor"],
        tag: "form",
        position: {
            width: 500,
            height: 500
        },
        window: {
            resizable: true,
            title: "CCSS.settings.settingsMenu.title",
            contentClasses: ["standard-form", "ccss-stylesheet-container"]
        },
        form: {
            handler: CcssEditor.ccssFormHandler,
            submitOnChange: false,
            closeOnSubmit: false
        }
    }

    static PARTS = {
        stylesheet: {
            template: "modules/custom-css/templates/settings.hbs",
        },
        footer: {
            template: "templates/generic/form-footer.hbs",
        }
    }

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
        options.parts = [];
        options.parts.push("stylesheet");
        options.parts.push("footer");
    }

    /**
     * Track dirty state for the form.
     */
    _dirty = false;

     /**
     * Process form submission for the sheet
     * @this {CcssEditor}                      The handler is called with the application as its bound scope
     * @param {SubmitEvent} event                   The originating form submission event
     * @param {HTMLFormElement} form                The form element that was submitted
     * @param {FormDataExtended} formData           Processed data for the submitted form
     * @returns {Promise<void>}
     */
    static async ccssFormHandler(event, form, formData) {
        // Update settings with form data
        await Settings.updateStylesheets(formData.object.worldStylesheet, formData.object.userStylesheet);
        this._dirty = false; // Reset dirty state after submission
        if (event.submitter.name == "ccss-save") {
            // If the Save button was clicked, close the form
            await this.close();
        }
    }

    /**
     * Construct an object of data to be passed to this froms HTML template.
     *
     * @param {string} partId - The part being rendered
     * @param {ApplicationRenderContext} context - The shared context provided by _prepareContext
     * @returns {Promise<ApplicationRenderContext>} Context data for the form part
     * @protected
     */
    async _preparePartContext(partId, context) {
        context.partId = `${this.id}-${partId}`;
        context.isGM = game.user.isGM;
        context.worldStylesheet = Settings.getStylesheet("world");
        context.userStylesheet = Settings.getStylesheet("user");
        context.buttons = [
            { type: "submit", icon: "fas fa-check", label: "CCSS.settings.apply", name: "ccss-apply" },
            { type: "submit", icon: "fas fa-save", label: "CCSS.settings.save", name: "ccss-save" }
        ];
        return context;
    }

    /**
     * Size the window once, to fit the viewport, rather than on every render.
     *
     * @param {object} [options] - Application options
     */
    constructor(options = {}) {
        const height = Math.min(game.user.isGM ? 900 : 500, window.innerHeight - 100);
        super(foundry.utils.mergeObject({ position: { height } }, options));
    }

    /**
     * Track dirty state; the form element outlives re-renders, so this runs once.
     */
    _onFirstRender(context, options) {
        super._onFirstRender(context, options);
        const dirty = () => { this._dirty = true; };
        this.element.addEventListener("input", dirty);
        this.element.addEventListener("change", dirty);
    }

    /**
     * Wire the World/User splitter; each render replaces the separator, so this runs every time.
     */
    _onRender(context, options) {
        super._onRender(context, options);
        const container = this.element.querySelector("#ccss-super-container");
        const separator = this.element.querySelector("#ccss-separator");
        if (!container || !separator) return;
        makeSplitter(container, separator, {
            split: Settings.split,
            onChange: split => Settings.setSplit(split),
        });
    }
}

// const app = new CcssEditor();
// app.render(true);
