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

  calculatePortfolio({
    btcPrice,
    stockPrice,
    periodicity,
    investment,
    start_date
  }) {
    let wallet = [];
    let accumulatedBtc = 0;
    let accumulatedStock = 0;
    let invested = 0;

    let actualDate = new Date(start_date);
    let dates = [];

    // create array of dates, to reverse them
    if (periodicity === Periodicity.DAILY) {
      for (let key in stockPrice) {
        if (
          stockPrice.hasOwnProperty(key) &&
          (dateFns.isAfter(new Date(key), actualDate) ||
            dateFns.isEqual(new Date(key), actualDate))
        ) {
          dates.push(new Date(key));
        }
      }
      dates.reverse();
    }

    // NOT WORKING!
    else if (periodicity === Periodicity.WEEKLY) {
      while (dateFns.isPast(actualDate)) {
        if (stockPrice.hasOwnProperty(this.formatDate(actualDate))) {
          dates.push(actualDate);
          actualDate = dateFns.addWeeks(actualDate, 1);
        } else {
          actualDate = dateFns.addDays(actualDate, 1);
        }
      }
    } else {
      while (dateFns.isPast(actualDate)) {
        if (stockPrice.hasOwnProperty(this.formatDate(actualDate))) {
          dates.push(actualDate);
          actualDate = dateFns.addMonths(actualDate, 1);
        } else {
          actualDate = dateFns.addDays(actualDate, 1);
        }
      }
    }

    // create object with investment
    dates.forEach(day => {
      let obj = {};

      btcPrice.forEach(btcDay => {
        // create object of bitcoin price
        let btcDate = new Date(btcDay[0]);
        if (dateFns.isEqual(day, btcDate)) {
          accumulatedBtc += investment / btcDay[3];
          invested += parseFloat(investment);

          (obj.date = new Date(btcDay[0])),
            (obj.accumulatedBtc = accumulatedBtc),
            (obj.invested = invested),
            (obj.investment_total_btc = accumulatedBtc * btcDay[3]);
        }
      });

      for (let key in stockPrice) {
        if (stockPrice.hasOwnProperty(key)) {
          let keyDate = new Date(key);

          if (dateFns.isEqual(keyDate, day)) {
            accumulatedStock += investment / stockPrice[key]["4. close"];
            obj.accumulatedStock = accumulatedStock;
            obj.investment_total_stock =
              accumulatedStock * stockPrice[key]["4. close"];
          }
        }
      }
      wallet.push(obj);
    });

    return wallet;
  },

  formatDate(date) {
    let month = "" + (date.getMonth() + 1),
      day = "" + date.getDate(),
      year = date.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }
};
