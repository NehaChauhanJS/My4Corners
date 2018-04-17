
var LocalStrategy = require('passport-local').Strategy;

var User = require('../model/models');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

passport.use('signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {

        User.findOne({ 'users.email' :  email }, function(err, user) {
            if (err)
                return done(err);

            if (user) {
                return done(null, false, req.flash('signupError', 'Email is already taken.'));
            } 
            else {

			    var newUser            = new User();

                newUser.users.email    = email;
                newUser.users.password = password; 
		
                newUser.save(function(err) {
                    if (err)
                        throw err;

                    return done(null, newUser);
                });
                }

        });

    }));


 passport.use('login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
         },
    function(req, email, password, done) { 
        User.findOne({ 'users.email' :  email }, function(err, user) {
            if (err)
                return done(err);

            
            if (!user)
                return done(null, false, req.flash('loginError', 'No user found.try Again')); // req.flash is the way to set flashdata using connect-flash
            if(user.users.password != password)
          		return done(null, false, req.flash('loginError', 'Password Error.try Again')); // req.flash is the way to set flashdata using connect-flash
            
            return done(null, user); 

        });

    }));






};

