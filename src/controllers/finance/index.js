const rp = require("request-promise");
const dateFns = require("date-fns");

const Periodicity = require("../../enum/periodicityEnum");

module.exports = {
  async listStockPrice(req) {
    try {
      const result = await rp({
        uri: process.env.FINANCEAPIURL,
        qs: {
          function: "TIME_SERIES_DAILY",
          symbol: req.query.symbol,
          outputsize: "full",
          apikey: process.env.FINANCEAPIURL
        },
        json: true
      });
      const key = Object.keys(result)[1];
      return result[key];
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

  calculateBtcAmount({
    btcPrice: priceArray,
    stockPrice,
    periodicity,
    investment: amount,
    start_date
  }) {
    let wallet = [];
    let accumulated = 0;
    let invested = 0;
    let actualDate = new Date(start_date);

    if (periodicity === Periodicity.DAILY) {
      priceArray.forEach(day => {
        if (!dateFns.isWeekend(new Date(day[0]))) {
          accumulated += amount / day[3];
          invested += parseFloat(amount);
          wallet.push({
            date: new Date(day[0]),
            accumulated,
            investment_total: accumulated * day[3],
            invested
          });
        }
      });
    }

    if (periodicity === Periodicity.WEEKLY) {
      priceArray.forEach(day => {
        if (new Date(day[0]).getDate() === actualDate.getDate()) {
          accumulated += amount / day[3];
          invested += parseFloat(amount);
          wallet.push({
            date: new Date(day[0]),
            accumulated,
            investment_total: accumulated * day[3],
            invested
          });
          actualDate = dateFns.addWeeks(actualDate, 1);
        }
      });
    }

    if (periodicity === Periodicity.MONTHLY) {
      priceArray.forEach(day => {
        if (new Date(day[0]).getDate() === actualDate.getDate()) {
          accumulated += amount / day[3];
          invested += parseFloat(amount);
          wallet.push({
            date: new Date(day[0]),
            accumulated,
            investment_total: accumulated * day[3],
            invested
          });
          actualDate = dateFns.addMonths(actualDate, 1);
        }
      });
    }

    return wallet;
  },

  calculateStockAmount({
    stockPrice: priceArray,
    periodicity,
    investment: amount,
    start_date
  }) {
    // get stock prices post start_date
    let inDate = [],
      key;
    const date = new Date(start_date);

    for (key in priceArray) {
      if (periodicity === Periodicity.DAILY) {
        if (
          priceArray.hasOwnProperty(key) &&
          (dateFns.isAfter(new Date(key), date) ||
            dateFns.isEqual(new Date(key), date))
        ) {
          inDate.push({
            date: new Date(key),
            close: parseFloat(priceArray[key]["4. close"])
          });
        }
      }
    }
    inDate.reverse();

    // calculate portfolio
    let wallet = [];
    let accumulated = 0;
    let invested = 0;

    inDate.forEach(day => {
      accumulated += amount / day.close;
      invested += parseFloat(amount);
      wallet.push({
        date: day.date,
        accumulated,
        investment_total: accumulated * day.close,
        invested
      });
    });

    return wallet;
  }
};
