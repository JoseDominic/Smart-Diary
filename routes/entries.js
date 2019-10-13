const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const { check, validationResult } = require('express-validator');

//Models
const Entry = require('../models/Entry');
const User = require('../models/User');

//route to view entries
router.get('/',ensureAuthenticated,(req,res) =>{
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