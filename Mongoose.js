import mongoose from "mongoose";
import MongoDBStore from "connect-mongodb-session";
import bcrypt from "bcryptjs";
import session from 'express-session';
import dotenv from "dotenv";
dotenv.config();
const NoteSchema = new mongoose.Schema({
    title: String,
    content: String,
    SubmissionDate: Date
});
const Category=new mongoose.Schema({
    category:
    {type:String},
    Notes:[NoteSchema]

});
const store = MongoDBStore(session);
const storage = new store({
    uri: process.env.ConnectionPort,
    collection: "sessions"
});

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
    email: {
        type: String || null,
        required: false
    },
    Notes: {
       type: [Category],
        
    }
});
const UserData = mongoose.model("UserData", UserSchema);

const CreateUser = async (username, password, res) => {
    if (await UserData.findOne({ username: username })) {
        return res.status(200).json({ message: "Username already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const User = new UserData({
        username: username,
        password: password,
        email: null
    });
    await User.save();
    return res.status(200).json({ message: "User Created" });
};

const verify = async (username, password, res) => {
    const data = await UserData.findOne({ username: username });
    if (data) {
        if (data.password == null) {
            return false;
        }
        const a = await bcrypt.compare(password, data.password);
        if (a) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

const CreateUniqueName = async (username) => {
    let data = await UserData.findOne({ username: username });
    let i = 0;
    while (data) {
        username = username + toString(i);
        data = await UserData.findOne({ username: username });
        i++;
    }
    return username;
};

const AddGoogleUser = async (username, email) => {
    username = username.split(" ").join("");
    username = username.toLowerCase();
    const Email = await UserData.findOne({ email: email });
    if (!Email) {
        username = await CreateUniqueName(username);
        const User = new UserData({
            username: username,
            password: null,
            email: email
        });
        await User.save();
    }
};const AddNote = async (username, title, content, SubmissionDate, category) => {
    try {
        const newNote = {
            title: title,
            content: content,
            SubmissionDate: SubmissionDate
        };

        const user = await UserData.findOne({ username: username });
        if (!user) {
            return;
        }

        const categoryIndex = user.Notes.findIndex(cat => cat.category.toUpperCase() === category.toUpperCase());
        if (categoryIndex !== -1) {
            // Category exists, add the note to the existing category
            user.Notes[categoryIndex].Notes.push(newNote);
        } else {
            // Category does not exist, create a new category with the note
            user.Notes.push({
                category: category,
                Notes: [newNote]
            });
        }
        await user.save();
    } catch (error) {
        console.error(`Error adding note: ${error.message}`);
    }
};

const getName= async (email) => {
    const data = await UserData.findOne({email:email});
    return data.username;
}
const getUserNote=async (username)=>{
    const data=await UserData.findOne({username:username});
    return data.Notes;
}
const deleteNote=async(req,res,next)=>{
    try{
    const {id}=req.body;
    const notes=await UserData.findOne({ username: req.user.username });
    for (let i=0;i<notes.Notes.length;i++)
      {
        for(let j=0;j<notes.Notes[i].Notes.length;j++)
        {
          if(notes.Notes[i].Notes[j]._id==id)
          {
            notes.Notes[i].Notes.splice(j,1);    
               break;
          }
        } 
      }
     for(let i=0;i<notes.Notes.length;i++)
     {
        if(notes.Notes[i].Notes.length==0)
        {
            notes.Notes.splice(i,1);
        }
     }
  await notes.save();
  next();
    }
    catch(e)
    {
        res.status(505).json({message:"Internal server error"});
    }
}
const Update=async(req,res,next)=>{
    try{
    const {category,title,description,id}=req.body;
    const notes=await UserData.findOne({ username: req.user.username });
   if(!category)
   {
    for (let i=0;i<notes.Notes.length;i++)
        {
        for(let j=0;j<notes.Notes[i].Notes.length;j++)
          {
            if(notes.Notes[i].Notes[j]._id==id)
            {
                notes.Notes[i].Notes[j].SubmissionDate=new Date();
              notes.Notes[i].Notes[j].title=title;
              notes.Notes[i].Notes[j].content=description;
              break;
            }
          }
        }
        await notes.save();
        return res.status(200).json({message:"Note updated successfully"});
   }
   for (let i=0;i<notes.Notes.length;i++)
    {
    if(notes.Notes[i].category==category)
    {
        notes.Notes[i].Notes.push(
            {
            SubmissionDate:new Date(),
            title:title,
            content:description,
            }
        )
        await notes.save();
      deleteNote(req,res,next);
      return res.status(200).json({message:"Note updated successfully"});
    } 
    }
    notes.Notes.push(
        {
        category:category,
        Notes:[
            {
            title:title,
            content:description,
            SubmissionDate:new Date(),
            }
        ]
    }
    )
      await notes.save();
      deleteNote(req,res,next);
      return res.status(200).json({message:"Note updated successfully"});
    }
    catch(e)
    {
        return res.status(505).json({message:"Internal server error"});
    }
}
const updateName=async(req,res)=>{
    try{
    const {username}=req.body;
    if(await UserData.findOne({ username: username }))
    {
        return res.status(200).json({message:"Username already exists"});
    }
    const notes=await UserData.findOne({ username: req.user.username });
    notes.username=username;
    await notes.save();
    req.user.username=username;
    return res.status(200).json({message:"Username updated successfully"});
    }catch(e)
    {
        return res.status(505).json({message:"Internal server error"});
    }
}
const updatePassword=async(req,res)=>{
    try{
    const {password,oldpass}=req.body;
    const notes=await UserData.findOne({ username: req.user.username });
    if(await bcrypt.compare(oldpass, notes.password))
    {
    const salt = await bcrypt.genSalt(10);
    notes.password=await bcrypt.hash(password, salt);
    await notes.save();
    return res.status(200).json({message:"Password updated successfully"});
    }else{
        return res.status(200).json({message:"Incorrect password"});
    }
    }catch(e)
    {
        return res.status(505).json({message:"Internal server error"});
    }   
}
const CheckUser=async(req,res)=>{
    try{
    const notes=await UserData.findOne({ username: req.user.username });
    if(notes.password==null)
    {
        return res.json({message:true});
    }
    return res.json({message:false});
}
    catch(e)
    {
        return res.json({message:false});
    }
}
const DeleteUser=async(req,res)=>{
    const {password,email}=req.body;
    try
    {
    if(!password){
        const notes=await UserData.findOne({ username: req.user.username });
        if(notes.email===email){
            
            await UserData.deleteOne({ username: req.user.username })  
            req.session.destroy();
            return res.status(200).json({message:"User deleted successfully"});
        }else{
            return res.status(505).json({message:"Incorrect email"});
        }
    }else{
        const notes=await UserData.findOne({ username: req.user.username });
        if(await bcrypt.compare(password, notes.password))
        {

            await UserData.deleteOne({ username: req.user.username })   
            req.session.destroy();  
    return res.status(200).json({message:"User deleted successfully"});
        }else
        {
            return res.status(505).json({message:"Incorrect password"});
        }
    }
}catch(e){
    return res.status(505).json({message:"Internal server error"});
}
}

export default CreateUser;
export { verify, AddGoogleUser, storage, getName,AddNote,getUserNote,deleteNote,Update,updateName,updatePassword,CheckUser,DeleteUser};
