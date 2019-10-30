const FinanceSerializer = {
    serialize(finance) {    
        return {
            invested: finance[finance.length - 1].invested,
            stockTotal: finance[finance.length - 1].accumulatedStock,
            btcTotal: finance[finance.length - 1].accumulatedBtc,
            chart: finance.map(f => {
                delete f.accumulatedBtc;
                delete f.invested;
                delete f.accumulatedStock;

                return f;
            })
        };
    }
};

module.exports = FinanceSerializer;
