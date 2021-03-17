import { createAuthor } from "./Author";

export default {
  title: "Components/author",
  argsTypes: {
    compiled: { control: "boolean" },
    view: { control: "object" },
  },
};

var view = {
  name: "Eduardo Lingán",
  link: "http://elingan.com",
  text: "@2021",
};

const Template = ({ compiled, view }) => createAuthor(compiled, view);

export const Default = Template.bind({});
Default.args = {
  compiled: true,
  view
};
