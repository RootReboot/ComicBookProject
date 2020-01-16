const express = require("express");
const errorhandler = require("errorhandler");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors());
app.use(errorhandler());
app.use(morgan("dev"));

app.listen(PORT, () => {
  console.log("Listening on port:" + PORT);
});

module.exports = app;
