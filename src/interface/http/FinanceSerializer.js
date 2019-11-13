const FinanceSerializer = {
    serialize(financeList, symbol) {
        try {
            return {
                invested: financeList[financeList.length - 1].invested,
                stockTotal: financeList[financeList.length - 1].accumulatedStock,
                btcTotal: financeList[financeList.length - 1].accumulatedBtc,
                chart: this.removeUnusedAttributes(financeList),
                symbol
            };
        } catch (error) {
            throw new Error(`Error on serialize function -> ${error.message}`);
        }
    },

    removeUnusedAttributes(financeList) {
        return financeList.map(f => {
            delete f.accumulatedBtc;
            delete f.accumulatedStock;

            return f;
        });
    }
};

module.exports = FinanceSerializer;
