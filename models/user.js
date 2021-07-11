const mongoose= require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
var schema= mongoose.Schema;
const bcrypt = require('bcrypt-nodejs')
const  async = require('async')
const crypto= require('crypto')

var validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};

const userschema= new schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true, unique: true},
    phone: {type: Number, required: true, unique: true},
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        validate: [validateEmail, 'Please fill a valid email address'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});


userschema.pre('save', function(next) {
    var user = this;
    var SALT_FACTOR = 5;
  
    if (!user.isModified('password')) return next();
  
    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
      if (err) return next(err);
  
      bcrypt.hash(user.password, salt, null, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
});

userschema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
    });
  };

userschema.plugin(passportLocalMongoose);

const model = mongoose.model("user", userschema);

module.exports = model;