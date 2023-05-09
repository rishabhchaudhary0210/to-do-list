const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Db } = require("mongodb");
const _ = require("lodash");
const { constant } = require("lodash");
const port = 80;

// let items = [];

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
mongoose.set("strictQuery",true);
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemSchema = {
    name:String
};
const Item = mongoose.model("Item",itemSchema); 

const listSchema = {
    name:String,
    items:[itemSchema]
};
const List = mongoose.model("List",listSchema);

let today = new Date();
let options = {
    weekday:"long",
    day:"numeric",
    month:"long",
    year:"numeric"
};
let day = today.toLocaleDateString("en-US", options);
// console.log(items);
app.get("/", (req,res)=>{
    // res.send("Server Started");
    Item.find((err,items)=>{
        if(err){
            // return err;
            console.log(err+"     this is an errrorrrrrrr!!!!!!");
        }else{
            res.render("list",{listTitle:day,newItems:items});
            // console.log(items);
        }
    });
});

app.post("/", (req,res)=>{
    var item = req.body.newTask;
    var listName = (req.body.list);
    console.log(item);
    const task = new Item({
        name:item
    });
    if(listName == day){
        task.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:_.lowerCase(listName)},(err,result)=>{
                if(!err){
                    if(result){
                        result.items.push(task);
                        result.save();
                    }
                }
                res.redirect("/"+listName);
        });


        // List.findOneAndUpdate({name:listName},{$push:{items:task}},(err,result)=>{
        //     err?console.log(err):console.log(result);
        // });
    }
});

app.post("/reset",(req,res)=>{
    const resetList = req.body.resetList;
    if(resetList == day){
        Item.deleteMany({},(err)=>{
            (err)?console.log(err):console.log("List Cleared");
        });
        res.redirect("/");
    }
    else{
        List.findOneAndUpdate({name:_.lowerCase(resetList)},{$set:{items:[]}},(err,result)=>{
            err?console.log(err):console.log(result);
        })
        res.redirect("/"+resetList);
    }
});

app.post("/delete",(req,res)=>{
    let removeTask = req.body.deleteTask;
    let removeList = req.body.deleteList;
    if(removeList == day){
        res.redirect("/");
        Item.deleteOne({name:removeTask},(err)=>{
            (err)?console.log(err):console.log(`Item Removed = ${removeTask}`);
        });
    }    
    else{
        List.findOneAndUpdate({name:_.lowerCase(removeList)},{$pull:{items:{name:removeTask}}},(err,result)=>{
            if(!err){
                res.redirect("/"+removeList);
            }
        });
    }
});

app.get("/:customListName",(req,res)=>{
    const customListName = _.lowerCase(req.params.customListName); 
    List.findOne({name:customListName},(err,result)=>{
        if(!err){
            if(!result){
                console.log("Doesnt Exist");
                const list = new List({
                    name:customListName,
                    items:[]
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                console.log("Exists");
                res.render("list",{listTitle:_.upperFirst(result.name),newItems:result.items});
            }
            console.log(result);
        }
    })
});

app.listen(port,()=>{
    console.log(`Server started at port : ${port}`);
})