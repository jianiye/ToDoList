const express = require("express");
const bodyParser = require("body-parser");
var _ = require('lodash');
const https = require("https");
const mongoose = require("mongoose");

// database
mongoose.connect("mongodb+srv://admin-jiani:" + process.env.PASSCODE + "@jianicloud.rguorah.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema ({
  name: {
    type:  String,
    required: [true, "Why no item?"]
  }
});
const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// contents
// const items = ["First to do", "Second to do", "Third to do"];
// const workItems = [];
const item1 = new Item ({
  name: "Welcome!"
})
const item2 = new Item ({
  name: "Hit + below to add a new todo!"
})
const item3 = new Item ({
  name: "Hit + above and type name to add a new list!"
})
const item4 = new Item ({
  name: "<-- Click here to finish a todo!"
})
const defaultitems = [item1, item2, item3, item4];

// date module
const date = require(__dirname + "/date.js");
var day = date.getDate();
const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

var dropList = [];
app.get("/", function(req, res){
  List.find({}, function(err, foundList){
    if (foundList){
         dropList = foundList;
    }
  })

  Item.find(function(err, items){
    if (items.length == 0){
      Item.insertMany(defaultitems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved all defaultitems!");
        }
      });
      res.redirect("/");
    }
    if (err) {
      console.log(err);
    } else {
        res.render("list", {today: day, lists: dropList, ListTitle: "ToDoList", newToDos: items});
    }
  });
});

app.post("/", function(req, res){
  let item = req.body.nextToDo;
  let listName = req.body.list;
  if (!item || item.length==0){
    res.redirect("/");
  } else {
    let todo = new Item ({
      name: item
    });
    if (listName === "ToDoList") {
      todo.save();
      res.redirect("/");
    } else {
      List.findOne({name:listName}, function(err, foundList){
        foundList.items.push(todo);
        foundList.save();
        res.redirect("/" + listName);
      })
    }
  }
});

app.post("/addnew", function(req, res){
  let newlist = _.capitalize(req.body.newlistname);
  if (!newlist){
    res.redirect("/")
  } else {
  List.findOne({name: newlist}, function(err, foundList){
    if (!err){
      if(!foundList){
        const list = new List({
          name: newlist,
          items: defaultitems
        });
        list.save();
        res.redirect("/" + newlist);
      } else {
        res.redirect("/" + newlist);
      }
    }
  });
 }
});

app.post("/delete", function(req, res){
  let checkid = req.body.checkbox;
  let listName = req.body.listName;
  Item.findByIdAndRemove(checkid, function(err){
    if (err) {
      console.log(err);
    } else {
      if (listName === "ToDoList") {
        console.log("Successfully deleted");
        res.redirect("/");
      }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkid}}}, function(err, foundList){
          if(!err){
            res.redirect("/" + listName);
          }
        })
      }
    }
  })
});

app.post("/deletelist", function(req, res){
  let listname = req.body.dellist;
  List.findOne({name: listname}, function(err, foundList){
    if (!err){
      if(!foundList){
            res.redirect("/");
      } else {
        let listId = foundList._id;
        List.findByIdAndRemove(listId, function(err){
          if (err) {
            console.log(err);
          } else {
            res.redirect("/");
          }
        });
      }
    }
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultitems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {today: day, lists: dropList, ListTitle: foundList.name, newToDos: foundList.items})
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
  console.log("This server is running~");
});
