import "dotenv/config";

import express from "express";
import routes from "./routes";
import { responseHandler } from "./middlewares";

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(express.json());
app.use("/v1", routes);

app.use(responseHandler);

app.use(function (req, res, next) {
  const response = {
    statusCode: 404,
    message: "Route not found",
  };
  responseHandler(response, req, res, next);
});

const server = app.listen(port);

console.log(`It works! Listening on port ${port}`);

export default server;
