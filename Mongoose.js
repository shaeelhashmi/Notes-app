import mongoose from "mongoose";
import bycrypt from "bcryptjs";
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    email:{
        type: String||null,
        required: false
    },
    Notes: {
        type: Array,
        required: false
    }
});
const UserData = mongoose.model("UserData", UserSchema);
const CreateUser =async (username, password,res) => {
    if(await UserData.findOne({username: username})){
       return res.status(400).json({error :"Username already exists"});
    }
    const salt = await bycrypt.genSalt(10);
    password = await bycrypt.hash(password, salt);
    const User = new UserData({
        username: username,
        password: password,
        email: null
    });
   await User.save();
   return res.status(200).json({message :"User Created"});
}
const verify=async (username,password,res)=>{
    const data=await UserData.findOne({username:username});
    if(data){
        const a=await bycrypt.compare(password, data.password);
        if(a){
        return true;
    }
    else{
        return false;
    }
}
else{
    return res.status(400).json({error :"Invalid credentials"});
}
}
const CreateUniqueName=async (username)=>{
    let data=await UserData.findOne({username:username});
    let i=0;
    while(data){
        username=username+toString(i);
        data=await UserData.findOne({username:username});
        i++;
    }
    return username;
}
const AddGoogleUser=async (username,email,res)=>{
    const Email=await UserData.findOne({email:email})
    if(!Email)
        {
    username=await CreateUniqueName(username);
    const User = new UserData({
        username: username,
        password: null,
        email: email
    });
    await User.save();
}
}
export default CreateUser;
export {verify};
export {AddGoogleUser};