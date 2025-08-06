
import { Settings } from './settings.js';

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
     * Handles editor resizing.
     * 
     * @param {element} element - The drag handle element.
     * @param {string} direction - The direction of the drag handle.
     * @memberof CcssEditor
     */
    dragElement(element, direction) {
        var md;
        const first = document.getElementById("ccss-world-stylesheet");
        const second = document.getElementById("ccss-user-stylesheet");
        const splitter = document.getElementById("ccss-super-container");
    
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
     * Set dynamic window height after rendering using the ApplicationV2 lifecycle hook.
     * @param {object} context - The rendering context.
     * @param {object} options - Render options.
     */
    _onRender(context, options) {
        this.setPosition({
            height: game.user.isGM ? 900 : 500
        });

        if (game.user.isGM) {
            this.dragElement(document.getElementById("ccss-separator"), "V");
        }

        // Track dirty state on input/change
        const form = this.element;
        if (form) {
            form.addEventListener('input', () => { this._dirty = true; });
            form.addEventListener('change', () => { this._dirty = true; });
        }
    }
}

// const app = new CcssEditor();
// app.render(true);
