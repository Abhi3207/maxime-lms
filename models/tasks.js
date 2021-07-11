const mongoose= require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
var schema= mongoose.Schema;

const taskschema = new schema({
    username: {type: String, required: true, unique: true},
    Title : {type : String},
    Desc : {type: String},
    Deadline : {type : Date}
})

taskschema.plugin(passportLocalMongoose);

const tmodel = mongoose.model("task", taskschema);

module.exports = tmodel;