const localStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//load user model
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new localStrategy({usernameField:'email'},(email,password,done) => {
            //Check if email is registered
            User.findOne({email:email})
                .then( user => {
                    if(!user){
                        return done(null,false,{message:'This email is not registered'});
                    }
                    //if email exists we compare password
                    bcrypt.compare(password,user.password,(err,isMatch) => {
                        if(err) throw err;
                        if(isMatch){
                            return done(null,user);
                        }
                        else{
                            return done(null,false,{message:'Wrong Password!'});
                        }
                    });
                }    
                )
                .catch(err => console.log(err));
        })
    );
  
    //Serialize and deserialize user

    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
    
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });
};

