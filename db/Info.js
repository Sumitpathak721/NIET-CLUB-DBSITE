const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const infoSchema = mongoose.Schema({
    clubOfTheYear:Object
})
module.exports = mongoose.model('clubs',clubSchema);