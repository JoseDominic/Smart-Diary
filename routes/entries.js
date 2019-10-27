const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const fs = require('fs');
const multer = require('multer');

// SET STORAGE using multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' + Date.now())
  }
})

const upload = multer({storage:storage});

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

//route to view search diary option private
router.get('/search',ensureAuthenticated,(req,res) =>{
  res.render('searchentry',{name:req.user.name});
});

//route to view search diary option PUBLIC
router.get('/public_search',ensureAuthenticated,(req,res) =>{
  res.render('search_public_post',{name:req.user.name});
});

//route to search PRIVATE diary for entry with date or keyword
router.post('/search',ensureAuthenticated,(req,res) => {
  const {date,keyword} =req.body;
  if(date && keyword){
    d = new Date(date);
    //console.log(d);
    // Entry.find({author:req.user.id,date:{ "$gte" : d, "$lt" : d.addDays(1) },body:{ $regex: keyword}},(err,result)=>{
    //   if(err) throw err;
    //   //console.log(result);
    //   res.render('allentryview',{result:result,name:req.user.name});
    // });
    var query = {$and:[{author:req.user.id},
      {date:{ "$gte" : d, "$lt" : d.addDays(1) }},
      {$or:[{body:{ $regex: keyword}},{title:{ $regex: keyword}}]} ]}

    Entry.find(query,(err,result)=>{
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
    Entry.find({$and:[{author:req.user.id},{$or:[{body:{ $regex: keyword}},{title:{ $regex: keyword}}]}]},(err,result) => {
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


//route to search PUBLIC diary for entry with date or keyword
//Bugs to be fixed - check view after empty result returend
//maked username unique

router.post('/public_search',ensureAuthenticated,(req,res) => {
  const {username,date,keyword} =req.body;
  let author =[];
  //console.log(username,date,keyword);
  if(username){
    //fetch id of the username mentioned
    User.find({name:{$regex:username}},(err,user) => {
      if (err) throw err;
      console.log('returned user',user,'type:',typeof user);
      if(typeof user[0]=='undefined'){
        console.log('no user exists');
        alert=[{msg:'Username you searched does not exist!.Make sure you entered the username correctly'}];
        res.render('search_public_post',{name:req.user.name,errors:alert});
        
      }
      else{
      console.log('returned user',user);
      user.forEach((item,index)=>{
        author.push(item.id);
      })  
      //author = user[0].id;
      console.log('author inside find()',author);
      //console.log('author outside find()',author);
    if(date && keyword){
      d = new Date(date);
      var query = {$and:[{author:{$in:author}},{public:true},
        {date:{ "$gte" : d, "$lt" : d.addDays(1) }},
        {$or:[{body:{ $regex: keyword}},{title:{ $regex: keyword}}]} ]}

      Entry.find(query,(err,result)=>{
        if(err) throw err;
        //console.log(result);
        // if(typeof result[0]=='undefined'){
        //   console.log('no entry exists with this date and keyword');
        //   req.flash('error_msg','No entry exists');
        //   res.redirect('/entries/public_search');
          
        // }
        res.render('public',{diary:result,name:req.user.name});
      });
    }
    else if(date){
      d = new Date(date);
      //console.log(d);
      Entry.find({author:{$in:author},public:true,date:{ "$gte" : d, "$lt" : d.addDays(1) }},(err,result)=>{
        if(err) throw err;
        //console.log(result);
        res.render('public',{result:result,name:req.user.name});
      });
    }
    else if(keyword){ //pure keyword search
      Entry.find({$and:[{author:{$in:author},public:true},
          {$or:[{body:{ $regex: keyword}},{title:{ $regex: keyword}}]}
        ]},
        (err,result) => {
        if(err) throw err;
        //console.log(result);
        res.render('public',{result:result,name:req.user.name});
      })
    }
    else{
      Entry.find({author:{$in:author},public:true},(err,result) => {
        if (err) throw err;
        res.render('public',{result:result,name:req.user.name});
      })   
    }
    }
  });
    
  
  }

  else{
    if(date && keyword){
      d = new Date(date);
      var query = {$and:[{public:true},
        {date:{ "$gte" : d, "$lt" : d.addDays(1) }},
        {$or:[{body:{ $regex: keyword}},{title:{ $regex: keyword}}]} ]}

      Entry.find(query,(err,result)=>{
        if(err) throw err;
        //console.log(result);
        res.render('public',{result:result,name:req.user.name});
      });
    }
    else if(date){
      d = new Date(date);
      //console.log(d);
      Entry.find({public:true,date:{ "$gte" : d, "$lt" : d.addDays(1) }},(err,result)=>{
        if(err) throw err;
        //console.log(result);
        res.render('public',{result:result,name:req.user.name});
      });
    }
    else if(keyword){ //pure keyword search
      Entry.find({$and:[{public:true},
          {$or:[{body:{ $regex: keyword}},{title:{ $regex: keyword}}]}
        ]},
        (err,result) => {
        if(err) throw err;
        //console.log(result);
        res.render('public',{result:result,name:req.user.name});
      })
    }
    else{
      req.flash('success_msg','Please fill atleast one field');
      res.redirect('/entries/public_search');
    }
  }  
});


//render view for adding entries
router.get('/add',ensureAuthenticated,(req,res) => {
  res.render('addentry',{name:req.user.name});
})

//DELETE entry
router.get('/delete/:id',ensureAuthenticated, function(req,res){

  Entry.findByIdAndDelete(req.params.id, function(err){
    if(err){
      console.log('err');
    }
    req.flash('success_msg','Entry deleted');
    res.redirect('/dashboard');
  });
});



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
router.post('/add',upload.single('picture'),ensureAuthenticated,(req,res) => {
  const { title,entry,visibility} = req.body;
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

    //handling uploaded image
    if(typeof req.file !='undefined'){
    console.log(req.file);
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    // Define a JSONobject for the image attributes for saving to database

    var finalImg = {
      contentType: req.file.mimetype,
      image: Buffer.from(encode_image, 'base64')
    };
    entry.img = finalImg;
    fs.unlink(req.file.path, (err) => {
      if (err) throw err}); //delete the img once saved to db
    }
    //console.log(finalImg);
    //console.log('database'+entry.img.contentType);

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
router.post('/edit/:id',upload.single('picture'),ensureAuthenticated, function(req, res){
  const { visibility } = req.body;
  let entry = {};
  entry.title = req.body.title;
  entry.author = req.user.id;
  entry.body = req.body.entry;
  entry.date = new Date();
  entry.authorname = req.user.name;
  //console.log('req.file'+req.file);
  if(typeof req.file !='undefined'){
    //console.log(req.file);
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    // Define a JSONobject for the image attributes for saving to database

    var finalImg = {
      contentType: req.file.mimetype,
      image: Buffer.from(encode_image, 'base64')
    };
    entry.img = finalImg;
    fs.unlink(req.file.path, (err) => {
      if (err) throw err}); //delete the img once saved to db
  }
  console.log(finalImg);
  //console.log('database'+entry.img.contentType);
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
