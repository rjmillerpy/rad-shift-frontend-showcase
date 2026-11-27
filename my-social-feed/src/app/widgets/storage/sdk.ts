import { API_URL } from "@/lib/config";

/** The widget SDK (radshift.storage), served by the API. The API adds it to
    every widget it renders; the editor's preview adds it with this. */
export const SDK_TAG = `<script src="${API_URL}/widgets/sdk.js"></script>`;

/** Load the SDK first in the document, before the widget's own scripts. */
export function withSdk(html: string): string {
  const head = html.indexOf("<head>");
  if (head === -1) return SDK_TAG + html;
  const at = head + "<head>".length;
  return html.slice(0, at) + SDK_TAG + html.slice(at);
}
