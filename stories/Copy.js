import mustache from "mustache";
import html from "../html/elements/copyright.html";

export const createComponent = function (compiled, view) {
  return compiled ? mustache.render(html, { copy: view }) : `<pre>"${html}"</pre>`;
};
