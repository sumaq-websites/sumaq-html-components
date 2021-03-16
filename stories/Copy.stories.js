import { createComponent } from "./Copy";

export default {
  title: "Components/Footer/Copy",
  argsTypes: {
    compiled: { control: "boolean" },
    view: { control: "object" },
  },
  args: {
    compiled: true,
    view: {
      name: "Eduardo Lingán",
      link: "http://elingan.com",
      year: "@2021",
    },
  },
};

export const Copy = ({compiled, view}) => createComponent(compiled, view);

// const Template = (args) => createAuthor(true, args);

// export const Default = Template.bind({});
// Default.args = {
//   name: "Eduardo Lingán",
//   link: "http://elingan.com",
//   text: "@2021",
// };
