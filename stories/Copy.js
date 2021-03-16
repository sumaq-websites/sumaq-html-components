import mustache from "mustache";
import html from "../html/components/copy.html";

export const createComponent = function (compiled, view) {
  return compiled ? mustache.render(html, { copy: view }) : `<pre>"${html}"</pre>`;
};
