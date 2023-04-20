const mongoose = require("mongoose");

const connect = () => {
  mongoose
    .connect("mongodb://localhost:27017/hw_lv2")
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => console.log(err));
};

mongoose.connection.on("error", (err) => {
  console.error("Failed to connect to MongoDB");
});

module.exports = connect;
