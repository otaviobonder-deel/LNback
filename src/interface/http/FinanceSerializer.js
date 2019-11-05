const FinanceSerializer = {
    serialize(financeList, symbol) {
        return {
            invested: financeList[financeList.length - 1].invested,
            stockTotal: financeList[financeList.length - 1].accumulatedStock,
            btcTotal: financeList[financeList.length - 1].accumulatedBtc,
            chart: this.removeUnusedAttributes(financeList),
            symbol
        };
    },

    removeUnusedAttributes(financeList) {
        try {
            return financeList.map(f => {
                delete f.accumulatedBtc;
                delete f.accumulatedStock;

                return f;
            });
        } catch (error) {
            return new Error('Error on serialize function');
        }
    }
};

module.exports = FinanceSerializer;
