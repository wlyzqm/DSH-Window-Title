import z from "@deepseek-ai/schemastery";

/**
 * Persisted window-title preference. An empty string restores the built-in
 * product title ("DeepSeek Harness"); edits made in Settings → General flow
 * back into this config through the Host settings document, so the value also
 * stays editable in cordis.patch.yml and survives upgrades.
 */
export const Config = z.object({
	title: z.string().default("").volatile()
});

/** Host half: the config schema above is this plugin's whole Host surface. */
export function apply() {}
