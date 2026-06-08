/**
 * Renders a JSON-LD <script> tag. `data` is our own structured-data object
 * (never user input), so `dangerouslySetInnerHTML` with `JSON.stringify` is
 * the standard, safe pattern here.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
