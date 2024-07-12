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
    console.log(username);
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
        console.log(`Note added to user ${username} in category ${category}.`);
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
const deleteNote=async(req,res)=>{
    try{
    const {id}=req.body;
    const notes=await UserData.findOne({ username: req.user.username });
    for (let i=0;i<notes.Notes.length;i++)
      {
        for(let j=0;j<notes.Notes[i].Notes.length;j++)
        {
            console.log(notes)
          if(notes.Notes[i].Notes[j]._id==id)
          {
            console.log(notes)
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
  res.status(200).json({message:"Note deleted successfully"});
    }
    catch(e)
    {
        res.status(505).json({message:"Internal server error"});
    }

}
export default CreateUser;
export { verify, AddGoogleUser, storage, getName,AddNote,getUserNote,deleteNote};
