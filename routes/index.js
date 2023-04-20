const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  return res.send("This is an api index page");
});

module.exports = router;
