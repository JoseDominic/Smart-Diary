const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');


const app = express();

//Passport config
require('./config/passport')(passport);

//DB config
require('dotenv').config(); //for setting environment variables on server
const uri = process.env.ATLAS_URI;//atlas uri stored in ATLAS_URI defined in .env
mongoose.connect(uri,{useNewUrlParser:true ,useUnifiedTopology: true})
    .then(() => console.log("mongodb connected"))
    .catch(err => console.log(err));



//EJS
app.use(expressLayouts);
app.set('view engine','ejs');
app.use(express.static(__dirname+'/public'));

//Express Bodyparser
app.use(express.urlencoded({extended:true}));

//Express session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  }));

//Passport middleware for authentication and login
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//global variables to create flash messages
app.use((req,res,next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.result = req.result;
    next();
});

//Routes
app.use('/',require('./routes/index'));
app.use('/users',require('./routes/users'));
app.use('/entries',require('./routes/entries'));
app.use('/email',require('./routes/email'));



const PORT = process.env.PORT || 5000;

app.listen(PORT,console.log(`Server started on port ${PORT}`));
