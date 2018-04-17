var express = require('express');
var router = express.Router();
var passport = require("passport");

router.post("/login",passport.authenticate('login', {
    successRedirect : '/drawing',
    failureRedirect : '/',
    failureFlash : true
}));

router.post("/signup",passport.authenticate('signup', {
    successRedirect : '/drawing',
    failureRedirect : '/signup',
    failureFlash : true
}));

router.get("/",isLoggedIns,function(req,res){
    res.render("index.ejs",{ message: req.flash('loginError') });
});

router.get("/signup",isLoggedIns,function(req,res){
    res.render("signup.ejs",{ message: req.flash('signupError') });
});

router.get("/drawing",isLoggedIn,function(req,res)
{
    res.render("drawing.ejs",{user : req.user });

});


router.get('/logout',isLoggedIn, function(req, res) {

    //update shared user list
    req.socket.emit('deleteSharedById', {id : req.id});
    req.logout();
    res.redirect('/');
});

//404 access
router.get("/*",function(req,res){
    res.render("404.ejs");
});


function isLoggedIn(req, res, drawing) {

    if (req.isAuthenticated())
        return drawing();
    res.redirect('/');
}

function isLoggedIns(req, res, drawing) {

    if (req.isAuthenticated())
        res.redirect('/drawing');
    else
        return drawing();
}
//enable socket.io

module.exports = router;
