const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const {graphqlHTTP} = require("express-graphql");
const helmet = require("helmet");
const dotenv = require("dotenv");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolver");
const auth = require("./middleware/is-auth");

const app = express();
dotenv.config();
app.use(helmet());
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(auth);

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(error) {
      if (!error.originalError) {
        return error;
      }

      const data = error.originalError.data;
      const message = error.message || "Internal server error.";
      const status = error.originalError.status || 500;
      return {message: message, status: status, data: data};
    },
  })
);

mongoose
  .connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.09la5.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`)
  .then(() => app.listen(process.env.PORT || 8080))
  .catch((error) => console.log(error));
