module.exports = {
    // checkSession: (req,res,next)=>{
    //     if(req.session.user) next()
    //     else{
    //        res.redirect('/')
    // }
    // },
    isAdminAuthorized: (req,res,next)=>{
        if(req.session.admin) next()
        else res.redirect('/admin/login')
    },


}



//working 
// const isLogin = (req,res,next)=>{
// try {
//     if(req.session.user_id){
//         next()
//      }else{
//         res.redirect('/login')
//      }
// } catch (error) {
//     console.log(error.message);
// }
// }




const isLogin = (req, res, next) => {
    try {
      if (req.session && req.session.user_id) {
        // Check if the session and user_id exist
        next();
      } else {
        // If not authenticated, redirect to the login page
        res.redirect('/login');
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  

const isLogout = (req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/login')
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isAdminAuthorized = (req,res,next)=>{
    if(req.session.admin) next()
    else res.redirect('/admin/login')
}

function validatePhoneNumber(req, res, next) {
    const phoneNumber = req.body.phonenumber;
    const phoneNumberPattern = /^\d{10}$/; // Assuming a 10-digit phone number
  
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
  
    if (!phoneNumberPattern.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
  
    next(); // Continue to the next middleware or route handler
  }
  


module.exports ={
    isLogin,
    isAdminAuthorized,
    isLogout,
    validatePhoneNumber,
    
}