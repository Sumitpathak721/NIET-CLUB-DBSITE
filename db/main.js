const mongoose = require('mongoose');

const mainSchema = mongoose.Schema({
    name:String,
    icon:String,
    video:String,
    desc1:String,
    desc2:String,
    admin:{type:Schema.Types.ObjectId,ref:'users'},
    helplineNo:[{type:String}],
    email:[{type:String}],
    clubOftheYear:{type:Schema.Types.ObjectId,res:'clubs'}
})
module.exports = mongoose.model('main',mainSchema);