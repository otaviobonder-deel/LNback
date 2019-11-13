const express = require('express');
const routes = express.Router();

const financeController = require('../controllers/finance');

const FinanceSerializer = require('../interface/http/FinanceSerializer');

routes.get('/liststock', async (req, res) => {
    try {
        const stockPriceList = await financeController.getStockPriceList(req);

        return res.json(stockPriceList);
    } catch (error) {
        return res.status(500).json({ message: `Error on /liststock endpoint -> ${error.message}` });
    }
});

routes.get('/stocksearch', async (req, res) => {
    try {
        const symbolFound = await financeController.findSymbol(req);

        return res.json(symbolFound);
    } catch (error) {
        return res.status(500).json({ message: `Error on /stocksearch endpoint -> ${error.message}` });
    }
});

routes.get('/btc', async (req, res) => {
    try {
        const price = await financeController.getBitcoinPriceList(req);

        return res.json(price);
    } catch (error) {
        return res.status(500).json({ message: `Error on /btc endpoint -> ${error.message}` });
    }
});

routes.get('/simulate', async (req, res) => {
    req.setTimeout(300000);

    try {
        const promises = [];
        promises.push(financeController.getBitcoinPriceList(req));
        promises.push(financeController.getStockPriceList(req));

        const [bitcoinPriceList, stockPriceList] = await Promise.all(promises);

        const portfolio = await financeController.generatePortfolio({
            bitcoinPriceList,
            stockPriceList,
            periodicity: req.query.periodicity,
            inputValue: req.query.investment,
            start_date: req.query.start_date
        });

        return res.json(FinanceSerializer.serialize(portfolio, req.query.symbol));
    } catch (error) {
        return res.status(500).json({ message: `Error on /simulate endpoint -> ${error.message}` });
    }
});

module.exports = routes;
