import { createComponent } from "./Author";

export default {
  title: "Components/Footer/Author",
  argsTypes: {
    compiled: { control: "boolean" },
    view: { control: "object" },
  },
  args: {
    compiled: true,
    view: {
      name: "Eduardo Lingán",
      link: "http://elingan.com",
      text: "Made with () by",
    },
  },
};

export const Author = ({compiled, view}) => createComponent(compiled, view);

// const Template = (args) => createAuthor(true, args);

// export const Default = Template.bind({});
// Default.args = {
//   name: "Eduardo Lingán",
//   link: "http://elingan.com",
//   text: "@2021",
// };
