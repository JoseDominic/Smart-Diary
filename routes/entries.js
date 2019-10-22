const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');

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

//route to view public posts
router.get('/public',ensureAuthenticated,(req,res) => {
  let usernames =[];
  Entry.find({public:true})
    .then(result =>{
      res.render('public',{usernames:usernames,name:req.user.name,result:result});  
      }) 
    .catch(err => console.log(err));
  });

//route to view search diary option
router.get('/search',ensureAuthenticated,(req,res) =>{
  res.render('searchentry',{name:req.user.name});
});

//route to search diary for entry with date or keyword
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
      //console.log(result);
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



//route to get a single entry (private view)
router.get('/:id',ensureAuthenticated,(req,res) => {
  Entry.findById(req.params.id,(err,result) => {
    if (err) throw err;
    //console.log(result);
    res.render('entryview',{diary:result,name:req.user.name});
  });
});

//route to get a single entry (public view)
router.get('/public/:id',ensureAuthenticated,(req,res) => {
  Entry.findById(req.params.id,(err,result) => {
    if (err) throw err;
    //console.log(result);
    res.render('pub_entryview',{diary:result,name:req.user.name});
  });
});

//add new entry
router.post('/add',ensureAuthenticated,(req,res) => {
  const { title,entry,visibility } = req.body;
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
    entry.authorname = req.user.name;
    if(visibility=='public'){
      entry.public = true;
      //console.log(visibility);
    }
    else{
      //console.log(visibility);
      entry.public = false;
    }

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

// Load Edit diary Form
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Entry.findById(req.params.id, (err, result) => {
    if (err) console.log(err);
    if(result.author != req.user.id){
      req.flash('error_msg', 'Not Authorized');
      res.redirect('/users/login');
    }
    else{
      res.render('editentry', {
        name:req.user.name,
        diary:result
      });
    }
  });
});

// Update diary 
router.post('/edit/:id', function(req, res){
  const { visibility } = req.body;
  let entry = {};
  entry.title = req.body.title;
  entry.author = req.user.id;
  entry.body = req.body.entry;
  entry.date = new Date();
  entry.authorname = req.user.name;
  if(visibility=='public'){
    entry.public = true;
    //console.log(visibility);
  }
  else{
    //console.log(visibility);
    entry.public = false;
  }

  let query = {_id:req.params.id}

  Entry.updateOne(query, entry, (err) => {
    if(err){
      console.log(err);
      return;
    } else {
      req.flash('success_msg', 'Diary Updated');
      res.redirect('/dashboard');
    }
  });
});  

module.exports = router
