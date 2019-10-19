const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const { check, validationResult } = require('express-validator');

//Models
const Entry = require('../models/Entry');
const User = require('../models/User');

//adding a function addDays to Date object to add days to date
Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

//Routes

//route to view all entries
router.get('/',ensureAuthenticated,(req,res) => {
  User.findById(req.user.id,(err,user) => {
    if(err) throw err;
    if(user){
      let userid = user.id
      Entry.find({author:userid},(err,result) => {
        if(err) throw err;
        //console.log(result);
        res.render('allentryview',{result:result,name:req.user.name});
      })
    }
  })
})

//route to view current week entries
router.get('/thisweek',ensureAuthenticated,(req,res) =>{
  User.findById(req.user.id,(err,user) => {
    if(err) throw err;
    if(user){
      let userid = user.id
      Entry.find({author:userid},(err,result) => {
        if(err) throw err;
        //console.log(result);
        res.render('dashboard',{result:result,name:req.user.name});
      })
    }
  })
});

//route to view search diary option
router.get('/search',ensureAuthenticated,(req,res) =>{
  res.render('searchentry',{name:req.user.name});  
});

//route to search diary for entry with date or keyword
//this needs to be completed
router.post('/search',ensureAuthenticated,(req,res) => {
  const {date,keyword} =req.body;
  if(date && keyword){
    d = new Date(date);
    //console.log(d);
    Entry.find({author:req.user.id,date:{ "$gte" : d, "$lt" : d.addDays(1) },body:{ $regex: keyword}},(err,result)=>{
      if(err) throw err;
      //console.log(result);
      res.render('allentryview',{result:result,name:req.user.name});
    });
  }
  else if(date){
    d = new Date(date);
    //console.log(d);
    Entry.find({author:req.user.id,date:{ "$gte" : d, "$lt" : d.addDays(1) }},(err,result)=>{
      if(err) throw err;
      //console.log(result);
      res.render('allentryview',{result:result,name:req.user.name});
    });
  }
  else if(keyword){ //pure keyword search
    Entry.find({author:req.user.id,body:{ $regex: keyword}},(err,result) => {
      if(err) throw err;
      console.log(result);
      res.render('allentryview',{result:result,name:req.user.name});
    })
  }
  else{
    req.flash('success_msg','Please fill atleast one field');
    res.redirect('/entries/search');
  }
});

//render view for adding entries
router.get('/add',ensureAuthenticated,(req,res) => {
  res.render('addentry',{name:req.user.name});
})

//route to get a single entry
router.get('/:id',ensureAuthenticated,(req,res) => {
  Entry.findById(req.params.id,(err,result) => {
    if (err) throw err;
    //console.log(result);
    res.render('entryview',{diary:result,name:req.user.name});
  });
});

//add new entry
router.post('/add',ensureAuthenticated,(req,res) => {
  const { title,entry } = req.body;
  const date = new Date();
  let errors = [];
    //Check required fields
    if(!title || !entry){
        errors.push({msg:'Please fill required fields'});
    }
    if(errors.length>0){
      res.render('addentry',{
          errors,
          name:req.user.name
      });
    }
    else{
      //validation passed
      let entry = new Entry();
    entry.title = req.body.title;
    entry.author = req.user.id;
    entry.body = req.body.entry;
    entry.date = date;

    entry.save(function(err){
      if(err){
        console.log(err);
        return;
      } else {
        req.flash('success_msg','Diary Added');
        res.redirect('/dashboard');
      }
    });
    
  }
    
});


  module.exports = router