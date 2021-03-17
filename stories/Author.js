import mustache from "mustache";
import html from "../html/author.html";

export const createAuthor = function (isCompiled, view) {
  return isCompiled ? mustache.render(html, { author: view }) : html;
};
