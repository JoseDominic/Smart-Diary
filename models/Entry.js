const mongoose = require('mongoose');

//Diary schema
const entrySchema = mongoose.Schema({
  title:{
    type:String,
    required:true
  },
  author:{
    type:String,
    required:true
  },
  body:{
    type:String,
    required:true
  },
  date:{type:Date,required:true},
  public:false,


});


const Entry = mongoose.model('Entry',entrySchema );
module.exports = Entry
