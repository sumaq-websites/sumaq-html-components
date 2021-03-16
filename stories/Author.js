import mustache from "mustache";
import html from "../html/components/author.html";

export const createComponent = function (compiled, view) {
  return compiled ? mustache.render(html, { author: view }) : `<pre>"${html}"</pre>`;
};
