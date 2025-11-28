const mongoose = require('mongoose');



const dbConnection = async ()=>{
    try{
        await mongoose.connect(process.env.mongoLink);
        console.log("Connection to the Database intiated. ");
    }catch(err){
        console.error(`Database Connection Error: \n${err}`);
    }
    
}


module.exports = dbConnection;




