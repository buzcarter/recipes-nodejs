/**
 * Fills `{{__name__}}`-style placeholders in an HTML template.
 *
 * Values are inserted with a *function* replacer: with a plain string, `String.replace` treats
 * `$&`, `$$`, `` $` `` and `$'` inside recipe text as special patterns and silently corrupts it.
 * Values are inserted as-is, so escape any untrusted text before passing it in.
 *
 * @param {string} template HTML containing placeholders
 * @param {Record<string, string | null | undefined>} values placeholder → HTML; nullish becomes `''`
 * @returns {string}
 */
export default function fillTemplate(template, values) {
  return Object.entries(values)
    .reduce((html, [placeholder, value]) => html.replaceAll(placeholder, () => value ?? ''), template);
}
