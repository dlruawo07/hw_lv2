const express = require("express");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output");

const app = express();
const port = 3000;

const indexRouter = require("./routes/index");
const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");
const authRouter = require("./routes/auth");

const connect = require("./schemas");

connect();

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(express.json());
app.use(cookieParser());

app.use("/api", [indexRouter, postsRouter, commentsRouter, authRouter]);

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
