var mongodb = require("mongodb");
var express = require("express");
var bodyParser = require("body-parser");
var ObjectID = mongodb.ObjectID;
var basicAuth = require('basic-auth');

var url = "mongodb://localhost:27017/mydb";
// var url = "mongodb://localhost:27017/";
// var url = "mongodb://<user>:<password>@ds052629.mlab.com:52629/sales-items";


const local_pass = "secret";
var auth = function (req, res, next) {
  function unauthorized(res) {
    return res.status(401).json("Authorization required");
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === 'admin' && user.pass === (process.env.HTTP_PASSWORD || local_pass)) {
    return next();
  } else {
    return unauthorized(res);
  };
};

var app = express();    
app.use(bodyParser.json());

var db;
const coll = "ITEMS_COLLECTION";

mongodb.MongoClient.connect(process.env.MONGODB_URI || url, (err, cli) => {
    if (err) console.log(err);

    console.log("DB connection ready");
    db = cli.db();
    db.createCollection("coll", (err, res) => {
        if (err) handleErrors(err, err.message, "Couldnot create",400);
    });
    var server = app.listen(process.env.PORT || 8080, () => {
        var port = server.address().port;
        console.log("app running on port", port);
    });
});

function handleErrors(res, reason, message, code){
    console.error(reason);
    res.status(500 || code).json({"error": message});
}


app.get("/api/items", auth, (req, res) => {
    db.collection(coll).find({}).toArray((err, docs) =>{
        if (err) handleErrors(err, err.message, "Failed to get items", 404);
        else res.status(200).json(docs);
    });
});

app.post("/api/items", auth, (req, res) => {
    var newItem = req.body;
    
    newItem.createDate = new Date();

    if (!req.body.id) handleErrors(res, "No id given", "Please provide the id", 400);
    // check if request passes this even id is not given and get inserted;
    db.collection(coll).insertOne(newItem, (err, doc) => {
        if (err) handleErrors(res, err.message, "Failed to create new item");
        else res.status(201).json(doc.ops[0]);
    });
});


app.post("/api/items/:id", auth,(req, res) => {
    var update = req.body;
    delete update._id;
    db.collection(coll).updateOne({_id: new ObjectID(req.params.id)},{$set: update}, (err, doc) =>{
        if (err) handleErrors(res, err.message, "Update failed");
        else {
            update._id = req.params.id;
            res.status(201).json(update);
        }      
    });
});

app.get("/", auth, (req, res) =>{
    res.status(200).json('Hi there!');
});

app.get("/api/items/deleteall", auth, (req, res) => {
    db.collection(coll).remove({}, (err, result) => {
        if (err) handleErrors(err, err.message, "Can not delete");
        else res.status(200).json(result);
    });
    
});