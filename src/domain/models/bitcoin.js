const mongoose = require('../../database')

const BitcoinSchema = mongoose.Schema({
    date: {
        type: Date
    },
    price: {
        type: Number
    }
})

const Bitcoin = mongoose.model('Bitcoin', BitcoinSchema)
