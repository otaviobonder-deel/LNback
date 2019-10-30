const express = require("express");
const routes = express.Router();
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
  const btcPrice = await financeController.getBtcPrice(req);
  const stockPrice = await financeController.listStockPrice(req);

  const btcAccumulated = financeController.calculatePortfolio({
    btcPrice,
    stockPrice,
    periodicity: req.query.periodicity,
    investment: req.query.investment,
    start_date: req.query.start_date
  });

  return res.json(btcAccumulated);
});

module.exports = routes;
