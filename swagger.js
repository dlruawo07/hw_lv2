const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "My API",
    description: "Description",
  },
  host: "3.37.87.110",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointFiles, doc);
