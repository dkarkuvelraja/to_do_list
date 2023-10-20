// Node_version-18.17.1;

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require('mongoose');
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err.message));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/TodoListDb');
}

const todoListSchema=new mongoose.Schema({
  name:String
});

const List=mongoose.model('list',todoListSchema);

const customschema=new mongoose.Schema({
  name:String,
  lists:[todoListSchema]
});

const Item=mongoose.model("item",customschema);

const item1=new List({
  name:"You have created a new Id"
});

const item2=new List({
  name:"You can delete this & add your own to do items"
});

const item3=new List({name:"Welcome"});

const defaultlist=[item3,item1,item2];

app.get("/",async (req,res)=>{
  const listA=await List.find();
  res.render("index",{
    lists:listA,
    Dates:"Today" 
  });
});

app.get("/:userId",async (req,res)=>{
  const userId=_.capitalize(req.params.userId);
  const founditem=await Item.findOne({name:userId}); 
  if (!founditem) {
    await Item.create({
      name:`${userId}`,
      lists:defaultlist
    });  
    res.redirect("/"+userId);
  } else {
    res.render("index",{
      lists:founditem.lists,
      Dates: founditem.name
    })
  }
});

app.post("/edit",async (req,res)=>{
  const toadd =req.body.input;
  const value=req.body.value;
  const topop=req.body.donedon;
  const newlists = await List.create({name:toadd});
  if (value === "Today") {
    await List.findOneAndRemove(topop);
    res.redirect("/");
  } else {
    await Item.findOneAndUpdate({name:value},{$pull:{lists:{name:topop}}});
    await Item.findOneAndUpdate({name:value},{$push: {lists:newlists}});
    res.redirect("/"+value); 
  }
});

app.post("/add",async (req,res)=>{
  const itemName=req.body.butt;
  const listsName=req.body.listtoadd;
  const newlists = await List.create({name:listsName});
  if (itemName === "Today") {
    res.redirect("/");
  } else {
    const founditem = await Item.findOne({name:itemName});
    console.log(founditem.lists)
    founditem.lists.push(newlists);
    founditem.save();
    res.redirect("/"+itemName);
  }
});

app.post("/delete",async (req,res)=>{
  const done=req.body.done;
  const check=req.body.check;
  if (done === "Today") {
    await List.findByIdAndRemove(check);
    res.redirect("/");
  } else {
    await Item.findOneAndUpdate({name:done},{$pull:{lists:{_id:check}}});
    res.redirect("/"+done)
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});