const express = require('express');
const routes = express.Router();
const financeController = require('../controllers/finance');

const FinanceSerializer = require('../interface/http/FinanceSerializer');

routes.get('/liststock', async (req, res) => {
    let stockPriceList, response;

    try {
        stockPriceList = await financeController.getStockPriceList(req);
        response = res.json(stockPriceList);
    } catch (error) {
        return new Error('Error on "/liststock" endpoint');
    }

    return response;
});

routes.get('/stocksearch', async (req, res) => {
    let symbolFound, response;

    try {
        symbolFound = await financeController.findSymbol(req);
        response = res.json(symbolFound);
    } catch (error) {
        return new Error('Error on "/stocksearch" endpoint');
    }

    return response;
});

routes.get('/btc', async (req, res) => {
    let price, response;

    try {
        price = await financeController.getBitcoinPriceList(req);
        response = res.json(price);
    } catch (error) {
        return new Error('Error on "/btc" endpoint');
    }
    return response;
});

routes.get('/simulate', async (req, res) => {
    req.setTimeout(300000);
    let portfolio, response;

    try {
        const bitcoinPriceList = await financeController.getBitcoinPriceList(req);
        const stockPriceList = await financeController.getStockPriceList(req);

        portfolio = await financeController.generatePortfolio({
            bitcoinPriceList,
            stockPriceList,
            periodicity: req.query.periodicity,
            inputValue: req.query.investment,
            start_date: req.query.start_date
        });

        response = res.json(FinanceSerializer.serialize(portfolio, req.query.symbol));
    } catch (error) {
        return new Error('Error on "/simulate" endpoint');
    }

    return response;
});

module.exports = routes;
