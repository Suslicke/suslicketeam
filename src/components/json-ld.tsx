/**
 * Renders a JSON-LD <script> tag. `data` is our own structured-data object
 * (never user input), but some fields (FAQ answers, case copy) come from i18n
 * messages, so we defensively escape `<` to `<`. This prevents a future
 * string containing `</script>` from breaking out of the script element.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
