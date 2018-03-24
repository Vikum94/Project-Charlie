var MonogoClient = require("mongodb").MongoClient;
var express = require("express");
var bodyParser = require("body-parser");

var url = "mongodb://localhost:27017/mydb";
// var url = "mongodb://localhost:27017/";

var app = express();
app.use(bodyParser.json());

var db;

MonogoClient.connect(process.env.MONGODB_URI || url, (err, cli) => {
    if (err) console.log(err);

    console.log("DB connection ready");
    db = cli.db();
    db.createCollection("ITEMS_COLLECTION", (err, res) => {
        if (err) handleErrors(err, err.message, "Couldnot create",400);
    });
    var server = app.listen(process.env.PORT || 8080, () => {
        var port = server.address().port;
        console.log("app running on port", port);
    });
});

function handleErrors(res, reason, message, code){
    console.error("$reason");
    res.status(500 || code).json({"error": message});
}

app.get("/api/items", (req, res) => {
    db.collection("ITEMS_COLLECTION").find({}).toArray((err, docs) =>{
        if (err) handleErrors(err, err.message, "Failed to get items", 404);
        else res.status(200).json(docs);
    });
});

app.post("/api/items", (req, res) => {
    var newItem = req.body;
    newItem.createDate = new Date();

    if (!req.body.id) handleErrors(res, "No id given", "Please provide the id", 400);
    // check if request passes this even id is not given and get inserted;
    db.collection("ITEMS_COLLECTION").insertOne(newItem, (err, doc) => {
        if (err) handleErrors(res, err.message, "Failed to create new item");
        else res.status(201).json(doc.ops[0]);
    });
});
 
