/**
 * Client half of dsh-window-title.
 *
 * Two responsibilities, both owned here:
 *
 * 1. A settings row registered into `settings.general.item` (the General
 *    section's additive seat, right after the appearance/font cluster) that
 *    edits this plugin's Host config field `title` through `ctx.configForms`.
 * 2. A document-title rewriter. `dsh-client-ui-layout` authors
 *    `document.title` as either "DeepSeek Harness" or
 *    "<session title> — DeepSeek Harness". A MutationObserver watches those
 *    writes and re-projects them through the custom preference as
 *    "<custom>" / "<custom> - <session title>". An empty preference leaves the
 *    layout-authored title untouched.
 */
window.__ModuleLoader__.load({
	id: "dsh-window-title",
	factory(require) {
		const React = require("react");
		const h = React.createElement;

		/** Locale namespace owning this feature's settings-row copy. */
		const SETTINGS_NS = "settings.window-title";
		/** Host plugin entry id: the settings-namespace key for the config form. */
		const ENTRY_ID = "dsh-window-title";
		/** Product title ui-layout hardcodes as the browser-title suffix. */
		const PRODUCT_TITLE = "DeepSeek Harness";
		/** Suffix layout writes after a live session title (em dash, spaced). */
		const LAYOUT_SUFFIX = ` — ${PRODUCT_TITLE}`;
		/** Separator of the custom form, per requested order: custom first. */
		const CUSTOM_SEPARATOR = " - ";

		const css = ".dwt_row{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.dwt_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.dwt_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.dwt_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}.dwt_field{box-sizing:border-box;flex:0 240px;min-width:0;height:36px;padding:0 14px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px}.dwt_field::placeholder{color:var(--dsw-alias-label-tertiary)}.dwt_field:focus-visible{outline-color:var(--dsw-alias-state-business-primary);outline-width:2px}";

		function installStyle() {
			const tagId = "dsh-window-title/row.css";
			if (document.querySelector(`style[data-plugin-css=${JSON.stringify(tagId)}]`) !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-window-title";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		/**
		 * Project one layout-authored base title through the custom preference.
		 * Unknown title shapes (another writer's) pass through untouched.
		 */
		function projectTitle(base, custom) {
			if (custom === "") return base;
			if (base === PRODUCT_TITLE) return custom;
			if (base.endsWith(LAYOUT_SUFFIX)) {
				return `${custom}${CUSTOM_SEPARATOR}${base.slice(0, base.length - LAYOUT_SUFFIX.length)}`;
			}
			return base;
		}

		/**
		 * Watch layout title writes and re-project them while a custom title is
		 * set. `base` keeps the last layout-authored title so clearing the
		 * preference (or disposing the rewriter) restores it exactly.
		 */
		function startRewriter(readCustom) {
			let base = document.title;
			let written;
			const apply = () => {
				const next = projectTitle(base, readCustom());
				written = next;
				if (document.title !== next) document.title = next;
			};
			const onTitleChange = () => {
				const current = document.title;
				if (current === written) return;
				base = current;
				apply();
			};
			const target = document.head.querySelector("title");
			const observer = new MutationObserver(onTitleChange);
			observer.observe(target ?? document.head, { childList: true, characterData: true, subtree: true });
			apply();
			return {
				refresh: apply,
				dispose() {
					observer.disconnect();
					if (document.title === written) document.title = base;
				}
			};
		}

		/**
		 * Settings → General row: label + description + text field. The field
		 * shows the persisted value (remounting when it changes) and commits on
		 * blur or Enter, matching the host font-family row's behavior.
		 */
		function WindowTitleRow({ t, useTitle, commitTitle }) {
			const value = useTitle();
			const title = t("title");
			const commit = (input) => {
				const next = input.value.trim().replace(/\s+/gu, " ");
				input.value = next;
				commitTitle(next);
			};
			return h("div", { className: "dwt_row" },
				h("div", { className: "dwt_rowText" },
					h("div", { className: "dwt_title" }, title),
					h("div", { className: "dwt_desc" }, t("description"))),
				h("input", {
					key: value,
					className: "dwt_field",
					type: "text",
					defaultValue: value,
					placeholder: t("placeholder"),
					"aria-label": title,
					spellCheck: false,
					autoComplete: "off",
					maxLength: 100,
					onBlur: (event) => { commit(event.currentTarget); },
					onKeyDown: (event) => {
						if (event.nativeEvent.isComposing || event.keyCode === 229) return;
						if (event.key === "Enter") event.currentTarget.blur();
					}
				}));
		}

		return {
			inject: ["slots", "locale", "configForms"],
			apply(ctx) {
				installStyle();
				ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
					zh: {
						"title": "窗口标题",
						"description": "自定义标签页显示的应用名称；会话中显示为「自定义名称 - 会话标题」，留空恢复默认",
						"placeholder": "默认 DeepSeek Harness"
					},
					en: {
						"title": "Window title",
						"description": "Customizes the app name shown in the browser tab. During a session the tab reads \"Custom name - Session title\". Leave empty to restore the default.",
						"placeholder": "Default: DeepSeek Harness"
					}
				}), "dsh-window-title: dictionaries");

				const form = ctx.configForms.get(ENTRY_ID);
				const readCustom = () => {
					const value = form.getSnapshot().value?.title;
					return typeof value === "string" ? value.trim() : "";
				};

				const rewriter = startRewriter(readCustom);
				ctx.effect(() => () => { rewriter.dispose(); }, "dsh-window-title: title rewriter");
				ctx.effect(() => form.subscribe(() => { rewriter.refresh(); }), "dsh-window-title: settings subscription");

				ctx.slots.inject("settings.general.item", () => ctx.slots.register({
					name: "settings.general.item",
					id: "window-title",
					order: 13,
					locale: SETTINGS_NS,
					inject: () => ({
						useTitle: () => React.useSyncExternalStore(
							(listener) => form.subscribe(listener),
							() => form.getSnapshot().value?.title ?? ""
						),
						commitTitle: (value) => {
							if (value === "") form.unset("title");
							else form.set("title", value);
						}
					})
				}, WindowTitleRow));
			}
		};
	}
});
