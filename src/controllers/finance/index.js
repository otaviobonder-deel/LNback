const rp = require("request-promise");
const dateFns = require("date-fns");

const Periodicity = require('src/enum/periodicityEnum');

module.exports = {
  async listStockPrice(req) {
    try {
      return await rp({
        uri: process.env.FINANCEAPIURL,
        qs: {
          function: `TIME_SERIES_${req.query.periodicity.toUpperCase()}`,
          symbol: req.query.symbol,
          outputsize: "full",
          apikey: process.env.FINANCEAPIURL
        },
        json: true
      });
    } catch (e) {
      return new Error(e);
    }
  },

  async symbolSearch(req) {
    try {
      let results = await rp({
        uri: process.env.FINANCEAPIURL,
        qs: {
          function: "SYMBOL_SEARCH",
          keywords: req.query.keywords,
          apikey: process.env.FINANCEAPI
        },
        json: true
      });
      let stockResults = [];
      results.bestMatches.map(stock => {
        const newProperties = (({ "1. symbol": value, "2. name": label }) => ({
          value,
          label: `${label} (${value})`
        }))(stock);
        stockResults.push(newProperties);
      });
      return stockResults;
    } catch (e) {
      return new Error(e);
    }
  },

  async getBtcPrice(req) {
    try {
      const result = await rp({
        uri: `${process.env.QUANDLURL}/BITSTAMP/USD`,
        qs: {
          start_date: req.query.start_date,
          api_key: process.env.QUANDLAPI
        },
        json: true
      });
      return result.dataset.data.reverse();
    } catch (e) {
      return new Error(e);
    }
  },

  calculateBtcAmount(priceArray, periodicity, amount, start_date) {
    let wallet = [];
    let accumulated = 0;
    let actualDate = new Date(start_date);

    if (periodicity === Periodicity.DAILY) {
      priceArray.forEach(day => {
        accumulated += amount / day[3];
        wallet.push({ date: new Date(day[0]), accumulated });
      });
    }

    if (periodicity === Periodicity.WEEKLY) {
      priceArray.forEach(day => {
        if (new Date(day[0]).getDate() === actualDate.getDate()) {
          accumulated += amount / day[3];
          wallet.push({ date: new Date(day[0]), accumulated });
          actualDate = dateFns.addWeeks(actualDate, 1);
        }
      });
    }

    if (periodicity === Periodicity.MONTHLY) {
      priceArray.forEach(day => {
        if (new Date(day[0]).getDate() === actualDate.getDate()) {
          accumulated += amount / day[3];
          wallet.push({ date: new Date(day[0]), accumulated });
          actualDate = dateFns.addMonths(actualDate, 1);
        }
      });
    }

    return wallet;
  }
};
