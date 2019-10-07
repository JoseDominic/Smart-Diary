//for preventing unauthorized access of pages
module.exports = {
    ensureAuthenticated: function(req,res,next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('error_msg','You need to login to view that resource!');
        res.redirect('/users/login');
    }
}