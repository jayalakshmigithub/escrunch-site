const userModel = require('../model/userModel');
const mongodbConnect = require('../config/connection');
const bcrypt = require('bcrypt');

module.exports.addUser = async(userData,callback)=>{
    console.log("Entered data in the form by user- in addUser helper fn- 1-",userData);

let user1 = {
    name:userData.name,
    email:userData.email,
    phonenumber:userData.phonenumber,
    password:userData.password,
};

user1.password = await bcrypt.hash(userData.password,10)
console.log(user1,"checking before adding user to db");
mongodbConnect().then(()=>{
    userModel.create(user1)
    .then(()=>{
        callback('DONE')
    })
    .catch(()=>{
        callback("FAILED")
    });
});
}
module.exports.getUser = (data)=>{
    console.log(data,"- now at the userhelper getuser");
    return new Promise((resolve,reject)=>{
        mongodbConnect()
        .then(()=>{
            userModel.findOne({email:data.email})
            .then((user)=>{
                if(user){
                    console.log("At getuserHelper, user from DB - password: ",data.password,"&&&&&","user.password",user.password);
                    bcrypt.compare(data.password,user.password)
                    .then((isMatch)=>{
                        if(isMatch){
                            resolve(user);
                        }else{
                            resolve(null);
                        }
                    })
                    .catch((error)=>{
                        console.log('error comparing passwords:',error);
                        reject(error)

                    });

                    
                }else{
                    resolve(null);
                }
            })
            .catch((error)=>{
                console.log('Failed to connect to the database:',error);
                reject(error)
            })
        })
    });
};
