//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _  = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//setup to connect MongooseDB:
main().catch(function (err) {
  console.log(err);
});


//no longer added to add 2nd parameter to connect method, {usNewUrlParser}

//for local DB hosting, use "mongodb://localhost:27017/todolistDB"
async function main() {
  await mongoose.connect("mongodb+srv://admin:test123@cluster0.hz4f6x7.mongodb.net/todolistDB");

  // 1. define schema
  const itemsSchema = new mongoose.Schema({
    name: String
  });

  // 2. create new Model based on above schema
  const Item = mongoose.model("Item", itemsSchema);

  // 3. create new document based on above
  const item1 = new Item({
    name: "Exciting todo list item #1!"
  });

  const item2 = new Item({
    name: "Exciting todo list item #2!"
  });

  const item3 = new Item({
    name: "Exciting todo list item #3!"
  });

  const defaultItems = [item1, item2, item3];

  const listSchema = {
    name: String,
    items: [itemsSchema]
  }

  const List = mongoose.model("List", listSchema);

  app.get("/", function (req, res) {

    try {
      Item.find({}).then(function (foundItems) {

        if (foundItems.length === 0) {

          try {
            Item.insertMany(defaultItems);
            console.log("Items entered successfully");
          } catch (err) {
            console.error("Error inserting items!", err);
          }
          // res.redirect("/");
        } else {

          res.render("list", { listTitle: "Today", newListItems: foundItems });
2
        }
      })
    } catch (err) {
      console.error("Not found!", err);
    }

  });

  app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }).then(function (foundList) {
      if (foundList) {
        // console.log("result found!", foundList);
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });

      } else {
        // console.log("could not find");

        const list = new List({
          name: customListName,
          items: defaultItems
        })

        list.save();
        res.redirect("/" + customListName);
      }
    })
  });

  app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    })

    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      List.findOne({ name: listName }).then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
    }
  });

  app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      Item.findOneAndDelete({ _id: checkedItemId }).then(function (deletedItem) {
        if (deletedItem) {
          console.log(deletedItem)
          console.log("Item was deleted: ", deletedItem.name);

        } else {
          console.log("Item not found.");
        }
      }).catch((err) => {
        console.error("Error deleting item: ", err);
      });

      res.redirect("/");
    } else {
      List.findOneAndUpdate({ name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      ).then(function () {
        res.redirect("/" + listName);
      })
    }
  })

  app.get("/work", function (req, res) {
    res.render("list", { listTitle: "Work List", newListItems: workItems });
  });

  app.get("/about", function (req, res) {
    res.render("about");
  });

  app.listen(3000, function () {
    console.log("Server started on port 3000");
  });
}
