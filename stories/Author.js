import mustache from "mustache";
import html from "../html/elements/author.html";

export const createComponent = function (compiled, view) {
  return compiled ? mustache.render(html, { author: view }) : `<pre>"${html}"</pre>`;
};
