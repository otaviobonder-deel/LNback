const express = require("express");
const routes = express.Router();
const financeController = require("../controllers/finance");

const FinanceSerializer = require("../interface/http/FinanceSerializer");

routes.get("/liststock", async (req, res) => {
  let response;

  try {
    response = await financeController.listStockPrice(req);
  } catch (error) {
    // Do something
  }

  return res.json(response);
});

routes.get("/stocksearch", async (req, res) => {
  let response;

  try {
    response = await financeController.symbolSearch(req);
  } catch (error) {
    // Do something
  }

  return res.json(response);
});

routes.get("/btc", async (req, res) => {
  let price;

  try {
    price = await financeController.getBtcPrice(req);
  } catch (error) {
    // Do something
  }
  return res.json(price);
});

routes.get("/simulate", async (req, res) => {
  let response;

  try {
    const btcPrice = await financeController.getBtcPrice(req);
    const stockPrice = await financeController.listStockPrice(req);

    response = financeController.calculatePortfolio({
      btcPrice,
      stockPrice,
      periodicity: req.query.periodicity,
      investment: req.query.investment,
      start_date: req.query.start_date
    });
  } catch (error) {
    // Do something
  }

  return res.json(FinanceSerializer.serialize(response, req.query.symbol));
});

module.exports = routes;
