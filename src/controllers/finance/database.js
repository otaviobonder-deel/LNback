const Bitcoin = require('../../domain/models/bitcoin')

module.exports = {
    async addToDatabase({ date, price }) {
        try {
            return await Bitcoin.create({
                [date]: price
            })
        } catch (e) {
            return new Error(e)
        }
    },
    async findDatabase({date}) {
        try {
            return await Bitcoin.find({date})
        } catch (e) {
            return new Error(e)
        }
    }
}
