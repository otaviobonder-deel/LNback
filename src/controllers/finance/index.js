const rp = require("request-promise");
const moment = require("moment");

const Periodicity = require("../../domain/enum/periodicityEnum");

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
    const dates = this.dateFilter({
      stockPrice,
      periodicity,
      actualDate: moment(start_date)
    });

    return this.buildWallet({ dates, btcPrice, stockPrice, investment });
  },

  buildWallet({ dates, btcPrice, stockPrice, investment }) {
    // create object with investment
    let wallet = [];
    let accumulatedBtc = 0;
    let accumulatedStock = 0;
    let invested = 0;

    dates.forEach(day => {
      let obj = {};

      btcPrice.forEach(btcDay => {
        // create object of bitcoin price
        let btcDate = moment(btcDay[0]);

        if (moment(day).isSame(btcDate)) {
          accumulatedBtc += investment / btcDay[3];
          invested += parseFloat(investment);

          (obj.date = moment(btcDay[0])),
            (obj.accumulatedBtc = accumulatedBtc),
            (obj.invested = invested),
            (obj.investment_total_btc = accumulatedBtc * btcDay[3]);
        }
      });

      for (let key in stockPrice) {
        if (stockPrice.hasOwnProperty(key)) {
          let keyDate = moment(key);

          if (moment(keyDate).isSame(day)) {
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

  dateFilter({ stockPrice, periodicity, actualDate }) {
    try {
      // create array of dates, to reverse them
      let dates = [];

      switch (periodicity) {
        case Periodicity.DAILY:
          for (let key in stockPrice) {
            if (
              stockPrice.hasOwnProperty(key) &&
              moment(key).isSameOrAfter(actualDate)
            ) {
              dates.push(moment(key));
            }
          }

          if (moment(dates[0]).isAfter(dates[1])) dates.reverse();
          return dates;

        case Periodicity.WEEKLY:
          while (moment(actualDate).isBefore()) {
            if (stockPrice.hasOwnProperty(this.formatDate(actualDate))) {
              dates.push(moment(actualDate));
              actualDate = moment(actualDate).add(1, "w");
            } else {
              actualDate = moment(actualDate).add(1, "d");
            }
          }

          if (moment(dates[0]).isAfter(dates[1])) dates.reverse();
          return dates;

        case Periodicity.MONTHLY:
          while (moment(actualDate).isBefore()) {
            if (stockPrice.hasOwnProperty(this.formatDate(actualDate))) {
              dates.push(moment(actualDate));
              actualDate = moment(actualDate).add(1, "M");
            } else {
              actualDate = moment(actualDate).add(1, "d");
            }
          }

          if (moment(dates[0]).isAfter(dates[1])) dates.reverse();
          return dates;
      }
    } catch (e) {
      return new Error(e);
    }
  },

  formatDate(date) {
    let month = "" + (moment(date).month() + 1),
      day = "" + moment(date).date(),
      year = moment(date).year();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }
};
