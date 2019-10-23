const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const nodeSchedule = require('node-schedule');

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

//render view to type email
router.get('/',ensureAuthenticated,(req,res) =>{
  var dtToday = new Date();
  
  var month = dtToday.getMonth() + 1;
  var day = dtToday.getDate();
  var year = dtToday.getFullYear();
  if(month < 10)
      month = '0' + month.toString();
  if(day < 10)
      day = '0' + day.toString();
  
  var maxDate = year + '-' + month + '-' + day;
    res.render('email',{name:req.user.name,maxDate:maxDate});
});

//schedule the email

//Parallel emails need to be implemented (under progress...)
//right now emails at same minute are simply differentiated by embedding current system second

router.post('/',ensureAuthenticated,(req,res) => {
    const {title,email,date,time} =req.body;
    var temp = time.split(':');
    var hour = parseInt(temp[0],10);
    var minute = parseInt(temp[1],10);
    //console.log(hour,minute);
    var mailAccountUser = 'diarygenie123@gmail.com'
    var mailAccountPassword = process.env.PASSWORD;

    // //for testing  purpose using mailtrap
    
    // var transport = nodemailer.createTransport({
    //     host: "smtp.mailtrap.io",
    //     port: 2525,
    //     auth: {
    //       user: "7057ae6b7a4c4f",
    //       pass: "1d3a874e20c789"
    //     }
    //   });
    
    var transport = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    secure:false,//do not use ssl certificate
    auth: {
        user: mailAccountUser,
        pass: mailAccountPassword
    },
    tls:{
      rejectUnauthorized:false //do not fail on invalid certificates
    }
    }));


      const message = {
        from: 'genie@diarygenie.com', // Sender address
        to: req.user.email,         // List of recipients
        subject: title, // Subject line
        text: email // Plain text body
    };
    var mailDate = new Date(date); 
    //console.log(hour,minute);
    mailDate.setHours(hour);
    mailDate.setMinutes(minute);
    temp = new Date();
    
    //check if date is past date
    if(mailDate < new Date()){
      var dtToday = new Date();
  
      var month = dtToday.getMonth() + 1;
      var day = dtToday.getDate();
      var year = dtToday.getFullYear();
      if(month < 10)
        month = '0' + month.toString();
      if(day < 10)
        day = '0' + day.toString();
  
      var maxDate = year + '-' + month + '-' + day;
      var alert = [{msg:"Genie can't sent mails to the past XD .Please enter a future date and time"}];
      res.render('email',{errors:alert,name:req.user.name,maxDate:maxDate,title:title,email:email});
      return;
    }

    //validation passed

    mailDate.setSeconds(temp.getSeconds());
    
    console.log(mailDate); //this date is in UTC
    
    
    //scheduling job to sent email at a given time
    nodeSchedule.scheduleJob(mailDate,() =>{
        transport.sendMail(message, function(err, info) {
            if (err) {
              console.log(err)
            } else {
              console.log(info);
              console.log('email sent successfully');
            }
            transport.close();
        });
        
    });
    req.flash('success_msg','Email scheduled successfully')
    res.redirect('/dashboard');  

});

module.exports = router;