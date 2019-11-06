const mongoose = require("mongoose");

const connection = {
    production: {
        url: `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@srv-captain--database/database`,
        options: {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true
        }
    },
    development: {
        url: `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@${process.env.MONGO_DB_IP}/database`,
        options: {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true
        }
    }
};

mongoose.connect(
    connection[process.env.ENVIRONMENT].url,
    connection[process.env.ENVIRONMENT].options
);
mongoose.Promise = global.Promise;

module.exports = mongoose;
