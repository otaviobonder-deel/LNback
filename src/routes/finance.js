const express = require("express");
const routes = express.Router();
const rp = require("request-promise");
const financeController = require("../controllers/finance");

routes.get("/liststock", async (req, res) => {
  const response = await financeController.listStockPrice(req);
  return res.json(response);
});

routes.get("/stocksearch", async (req, res) => {
  const response = await financeController.symbolSearch(req);
  return res.json(response);
});

routes.get("/btc", async (req, res) => {
  const price = await financeController.getBtcPrice(req);
  return res.json(price);
});

routes.get("/simulate", async (req, res) => {
  const price = await financeController.getBtcPrice(req);
  const accumulated = financeController.calculateBtcAmount(
    price,
    req.query.periodicity,
    req.query.investment,
    req.query.start_date
  );
  return res.json(accumulated);
});

module.exports = routes;
