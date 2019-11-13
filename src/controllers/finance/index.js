const rp = require('request-promise');
const moment = require('moment');

const Periodicity = require('../../domain/enum/periodicityEnum');

module.exports = {
    async getStockPriceList(req) {
        try {
            const result = await rp({
                uri: process.env.FINANCEAPIURL,
                qs: {
                    function: 'TIME_SERIES_DAILY',
                    symbol: req.query.symbol,
                    outputsize: 'full',
                    apikey: process.env.FINANCEAPIURL
                },
                json: true
            });

            const key = Object.keys(result)[1];

            return result[key];
        } catch (error) {
            throw new Error(`Error on getStockPriceList function -> ${error.message}`);
        }
    },

    async getBitcoinPriceList(req) {
        try {
            const result = await rp({
                uri: `${process.env.QUANDLURL}/BCHARTS/BITSTAMPUSD`,
                qs: {
                    start_date: req.query.start_date,
                    api_key: process.env.QUANDLAPI
                },
                json: true
            });

            return result.dataset.data.reverse();
        } catch (error) {
            throw new Error(`Error on getBitcoinPriceList function -> ${error.message}`);
        }
    },

    async findSymbol(req) {
        try {
            let results = await rp({
                uri: process.env.FINANCEAPIURL,
                qs: {
                    function: 'SYMBOL_SEARCH',
                    keywords: req.query.keywords,
                    apikey: process.env.FINANCEAPI
                },
                json: true
            });

            let stockResults = [];

            results.bestMatches.map(stock => {
                const newProperties = (({ '1. symbol': value, '2. name': label }) => ({
                    value,
                    label: `${label} (${value})`
                }))(stock);
                stockResults.push(newProperties);
            });

            return stockResults;
        } catch (error) {
            throw new Error(`Error on findSymbol function -> ${error.message}`);
        }
    },

    async generatePortfolio({ bitcoinPriceList, stockPriceList, periodicity, inputValue, start_date }) {
        let commonDates, response;

        try {
            commonDates = await this.dateListFilter({
                stockPriceList,
                periodicity,
                startDate: moment(start_date)
            });

            response = await this.buildWallet({ commonDates, bitcoinPriceList, stockPriceList, inputValue });
        } catch (error) {
            throw new Error(`Error on generatePortfolio function -> ${error.message}`);
        }

        return response;
    },

    buildWallet({ commonDates, bitcoinPriceList, stockPriceList, inputValue }) { // create object with inputValue
        let wallet = [];
        let accumulatedBtc = 0;
        let accumulatedStock = 0;
        let invested = 0;

        const bitcoinList = this.createObjFromList(bitcoinPriceList);

        for (let day of commonDates) {
            let obj = {};

            const found = bitcoinList[day.format('YYYY-MM-DD')];

            if (found) {
                accumulatedBtc += inputValue / found[3];
                invested += parseFloat(inputValue);

                obj.date = moment(found[0]);
                obj.accumulatedBtc = accumulatedBtc;
                obj.invested = invested;
                obj.investment_total_btc = accumulatedBtc * found[3];
            }

            const stockList = stockPriceList[day.format('YYYY-MM-DD')];

            if (stockList) {
                accumulatedStock += inputValue / stockList['4. close'];
                obj.accumulatedStock = accumulatedStock;
                obj.investment_total_stock = accumulatedStock * stockList['4. close'];
            }

            if (obj.invested) wallet.push(obj);
        }

        return wallet;
    },

    dateListFilter({ stockPriceList, periodicity, startDate }) { // create array of dates, to reverse them
        let commonDates = [];

        switch (periodicity) {
        case Periodicity.DAILY:
            for (let key in stockPriceList) {
                // eslint-disable-next-line no-prototype-builtins
                if (stockPriceList.hasOwnProperty(key) && moment(key).isSameOrAfter(startDate) && !moment(key).isSameOrAfter(moment(), 'day')) {
                    commonDates.push(moment(key));
                }
            }

            break;

        case Periodicity.WEEKLY:
            while (startDate.isBefore()) {
                if (startDate.format('YYYY-MM-DD') in stockPriceList) {
                    commonDates.push(moment(startDate));
                    startDate.add(1, 'w');
                } else {
                    startDate.add(1, 'd');
                }
            }

            break;

        case Periodicity.MONTHLY:
            while (startDate.isBefore()) {
                if (startDate.format('YYYY-MM-DD') in stockPriceList) {
                    commonDates.push(moment(startDate));
                    startDate.add(1, 'M').date(1);
                } else {
                    startDate.add(1, 'd');
                }
            }

            break;
        }

        if (moment(commonDates[0]).isAfter(commonDates[1])) commonDates.reverse();
        return commonDates;
    },

    createObjFromList(list) {
        let obj = {};

        list.forEach(e => {
            if(e[3] !== 0)
                obj[e[0]] = e;
        });

        return obj;
    }
};
