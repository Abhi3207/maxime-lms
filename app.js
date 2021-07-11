
const express               =  require('express');
      app                   =  express();
      mongoose              =  require("mongoose");
      passport              =  require("passport");
      bodyParser            =  require("body-parser");
      LocalStrategy         =  require("passport-local");
      passportLocalMongoose =  require("passport-local-mongoose");
      User                  =  require("./models/user");
      tasks = require('./models/tasks');
const  nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const favicon = require('static-favicon');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const  bcrypt  = require('bcrypt-nodejs');
const async  = require('async');
const crypto = require('crypto');
const flash = require('express-flash');
//Connecting database
mongoose.connect("mongodb://localhost/lms_auth");
app.use(require("express-session")({
    secret:"Any normal Word",       //decode or encode session
    resave: false,          
    saveUninitialized:false    
}));
passport.serializeUser(User.serializeUser());       //session encoding
passport.deserializeUser(User.deserializeUser());   //session decoding
passport.use(new LocalStrategy(User.authenticate()));

app.set("view engine","ejs");
app.use(flash());
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded(
      { extended:true }
))
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
//=======================
//      R O U T E S
//=======================
app.get("/", (req,res) =>{
    res.render("home");
})
app.get("/userprofile",isLoggedIn ,(req,res) =>{
    res.render("userprofile", {  name1 : req.user.username });
})
//Auth Routes
app.get("/login",(req,res)=>{
    res.render("login");
});
app.post("/login",passport.authenticate("local",{
    successRedirect:"/userprofile",
    failureRedirect:"/login"
}),function (req, res){
});
app.get("/register",(req,res)=>{
    res.render("register");
});
app.post("/register",(req,res)=>{
    
    User.register(new User({username: req.body.username,password:req.body.password,phone: req.body.phone,email: req.body.email}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.render("register");
        }
    passport.authenticate("local")(req,res,function(){
        res.redirect("/login");
    })    
    })
})
app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});
function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}
app.get('/forgot',(req,res)=>{
   res.render('forgot'); 
});
app.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var transport = nodemailer.createTransport( {
          service: 'Gmail',
          auth: {
            user: user.email,
            pass: user.password
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'passwordreset@demo.com',
          subject: 'Node.js Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        transport.sendMail(mailOptions, function(err) {
          req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
});
app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {
        user: req.user
      });
    });
});
app.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
  
          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
  
          user.save(function(err) {
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
      },
      function(user, done) {
        var transport = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: user.email,
            pass: user.password
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'passwordreset@demo.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        transport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/');
    });
});
app.get('/dashboard', isLoggedIn,(req,res)=>{
    res.render('dashboard',{  name1 : req.user.username , email : req.user.email, phone: req.user.phone});
})
app.get('/tasks', isLoggedIn,(req,res)=>{
    res.render('tasks');
})
app.post('/tasks', isLoggedIn,(req,res)=>{
    tasks.register(new tasks({username: req.body.name, Title:req.body.title, Desc: req.body.dsec, Deadline: req.body.deadline}))
    if(err) console.log(err);
    res.render('userprofile',{
        user1 : req.tasks.username,
        user2: req.user.username,
        tit : req.tasks.Title,
        des : req.tasks.Desc,
        dat : req.tasks.Deadline
    }) 
   
})

//Listen On Server
app.listen(process.env.PORT ||3000,function (err) {
    if(err){
        console.log(err);
    }else {
        console.log("Server Started At Port 3000");
    }
      
});