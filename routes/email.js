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
    res.render('email',{name:req.user.name});
});

//schedule the email
//NEEDS TO BE COMPLETED (under progress...)
router.post('/',ensureAuthenticated,(req,res) => {
    const {title,email,date,time} =req.body;
    var temp = time.split(':');
    var hour = parseInt(temp[0],10);
    var minute = parseInt(temp[1],10);
    //console.log(hour,minute);
    var mailAccountUser = 'gamerthegreat007@gmail.com'
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
    auth: {
        user: mailAccountUser,
        pass: mailAccountPassword
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
    //console.log(mailDate); //this date is in UTC
    
    
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