/* eslint-disable no-prototype-builtins */
const rp = require('request-promise')
const moment = require('moment')
const database = require('../finance/database')

const Periodicity = require('../../domain/enum/periodicityEnum')

module.exports = {
    async listStockPrice(req) {
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
            })

            const key = Object.keys(result)[1]

            return result[key]
        } catch (error) {
            return new Error('Error on listStockPrice function')
        }
    },

    async symbolSearch(req) {
        try {
            let results = await rp({
                uri: process.env.FINANCEAPIURL,
                qs: {
                    function: 'SYMBOL_SEARCH',
                    keywords: req.query.keywords,
                    apikey: process.env.FINANCEAPI
                },
                json: true
            })

            let stockResults = []

            results.bestMatches.map(stock => {
                const newProperties = (({
                    '1. symbol': value,
                    '2. name': label
                }) => ({
                    value,
                    label: `${label} (${value})`
                }))(stock)
                stockResults.push(newProperties)
            })

            return stockResults
        } catch (error) {
            return new Error('Error on symbolSearch function')
        }
    },

    async getBtcPrice(req) {
        try {
            const dbprice = await database.findDatabase({
                date: req.query.start_date
            })
            if (!!dbprice) {
            }

            const result = await rp({
                uri: `${process.env.QUANDLURL}/BITSTAMP/USD`,
                qs: {
                    start_date: req.query.start_date,
                    api_key: process.env.QUANDLAPI
                },
                json: true
            })

            return result.dataset.data.reverse()
        } catch (error) {
            return new Error('Error on getBtcPrice function')
        }
    },

    async calculatePortfolio({
        btcPrice,
        stockPrice,
        periodicity,
        investment,
        start_date
    }) {
        let dates, response

        try {
            dates = await this.dateFilter({
                stockPrice,
                periodicity,
                actualDate: moment(start_date)
            })

            response = await this.buildWallet({
                dates,
                btcPrice,
                stockPrice,
                investment
            })
        } catch (error) {
            return new Error('Error on calculatePortfolio function')
        }

        return response
    },

    buildWallet({ dates, btcPrice, stockPrice, investment }) {
        // create object with investment
        let wallet = []
        let accumulatedBtc = 0
        let accumulatedStock = 0
        let invested = 0

        dates.forEach(day => {
            let obj = {}

            btcPrice.forEach(btcDay => {
                // create object of bitcoin price
                let btcDate = moment(btcDay[0])

                if (day.isSame(btcDate, 'day')) {
                    accumulatedBtc += investment / btcDay[3]
                    invested += parseFloat(investment)

                    obj.date = btcDate
                    obj.accumulatedBtc = accumulatedBtc
                    obj.invested = invested
                    obj.investment_total_btc = accumulatedBtc * btcDay[3]
                }
            })

            for (let key in stockPrice) {
                if (
                    stockPrice.hasOwnProperty(key) &&
                    moment(key).isSame(day, 'day')
                ) {
                    accumulatedStock += investment / stockPrice[key]['4. close']
                    obj.accumulatedStock = accumulatedStock
                    obj.investment_total_stock =
                        accumulatedStock * stockPrice[key]['4. close']
                }
            }

            if (obj.invested) wallet.push(obj)
        })

        return wallet
    },

    dateFilter({ stockPrice, periodicity, actualDate }) {
        // create array of dates, to reverse them
        let dates = []

        switch (periodicity) {
            case Periodicity.DAILY:
                for (let key in stockPrice) {
                    if (
                        stockPrice.hasOwnProperty(key) &&
                        moment(key).isSameOrAfter(actualDate) &&
                        !moment(key).isSameOrAfter(moment(), 'day')
                    ) {
                        dates.push(moment(key))
                    }
                }

                if (moment(dates[0]).isAfter(dates[1])) dates.reverse()
                return dates

            case Periodicity.WEEKLY:
                while (moment(actualDate).isBefore()) {
                    if (this.formatDate(actualDate) in stockPrice) {
                        dates.push(moment(actualDate))
                        actualDate = moment(actualDate).add(1, 'w')
                    } else {
                        actualDate = moment(actualDate).add(1, 'd')
                    }
                }

                if (moment(dates[0]).isAfter(dates[1])) dates.reverse()
                return dates

            case Periodicity.MONTHLY:
                while (moment(actualDate).isBefore()) {
                    if (this.formatDate(actualDate) in stockPrice) {
                        dates.push(moment(actualDate))
                        actualDate = moment(actualDate).add(1, 'M')
                    } else {
                        actualDate = moment(actualDate).add(1, 'd')
                    }
                }

                if (moment(dates[0]).isAfter(dates[1])) dates.reverse()
                return dates
        }
    },

    formatDate(date) {
        let month = '' + (moment(date).month() + 1),
            day = '' + moment(date).date(),
            year = moment(date).year()

        if (month.length < 2) month = '0' + month
        if (day.length < 2) day = '0' + day

        return [year, month, day].join('-')
    }
}
