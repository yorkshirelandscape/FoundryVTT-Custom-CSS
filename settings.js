import { CcssEditor } from './ccss-editor.js';

export const modName = 'Custom Css';
const mod = 'custom-css';

/**
 * Provides functionality for interaction with module settings
 *
 * @export
 * @class Settings
 */
export class Settings {
    /**
     * Retrieves the combined stylesheet data from settings.
     *
     * @static
     * @param {scope} Which stylesheet to retrieve ("world" or "user")
     * @return {string} The CSS stored in the stylesheet setting.
     * @memberof Settings
     */
    static getStylesheet(scope) {
        if (scope === "world") {
            const newSheet = game.settings.get(mod, "worldStylesheet");
            if (newSheet === "/* Custom CSS */" || newSheet === "" ) {
                try {
                    const oldSheet = game.settings.get(mod, "stylesheet");
                    if (oldSheet !== "/* Custom CSS */" && oldSheet !== "") {
                        this.setStylesheet(oldSheet, "world");
                        return oldSheet;
                    }
                } catch (error) {
                    return newSheet; // If the old setting doesn't exist, return the new default
                }
            } else {
                return newSheet;
            }
        } else if (scope === "user") {
            return game.settings.get(mod, "userStylesheet");
        }
        return "";
    }

    /**
     * Stores data in the world stylesheet settings.
     *
     * @static
     * @param {string} css - The new CSS to be stored
     * @param {string} scope - The scope of the stylesheet ("world" or "user")
     * @return {Promise} A promise fulfilled once the setting has been stored. 
     * @memberof Settings
     */
    static async setStylesheet(css, scope) {
        const cssOrDefault = (css == null || css == undefined || css == "") ? "/* Custom CSS */" : css;
        return game.settings.set(mod, `${scope}Stylesheet`, cssOrDefault);
    }

    /**
     * Saves new stylesheet data, then reapplies the styles.
     *
     * @static
     * @param {string} worldCss - The new CSS to be updated for the world.
     * @param {string} userCss - The new CSS to be updated for the user.
     * @memberof Settings
     */
    static async updateStylesheets(worldCss, userCss) {
        if (game.user.isGM) {
            await this.setStylesheet(worldCss, "world");
        }
        await this.setStylesheet(userCss, "user");

        window.CustomCss.applyStyles();

        if (game.user.isGM) game.socket.emit("module.custom-css");
    }

    /**
     * Fetch the game setting for whether or not to do a transition animation.
     *
     * @readonly
     * @static
     * @memberof Settings
     */
    static get doTransition() {
        return game.settings.get(mod, "transition");
    }

    /**
     * Registers all of the necessary game settings for the module
     *
     * @static
     * @memberof Settings
     */
    static registerSettings() {
        game.settings.register(mod, "stylesheet", {
            scope: "world",
            config: false,
            type: String,
            default: "/* Custom CSS */"
        });

        game.settings.register(mod, "worldStylesheet", {
            scope: "world",
            config: false,
            type: String,
            default: "/* Custom CSS */"
        });

        game.settings.register(mod, "userStylesheet", {
            scope: "client",
            config: false,
            type: String,
            default: "/* Custom CSS */"
        });

        game.settings.registerMenu(mod, 'settingsMenu', {
            name: game.i18n.localize("CCSS.settings.settingsMenu.name"),
            label: game.i18n.localize("CCSS.settings.settingsMenu.label"),
            icon: "fas fa-wrench",
            type: CcssEditor,
            restricted: false
        });

        game.settings.register(mod, "transition", {
            name: game.i18n.localize("CCSS.settings.transition.name"),
            hint: game.i18n.localize("CCSS.settings.transition.hint"),
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        });
    }
}
