const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var mongoose = require('mongoose');
const { response } = require('express');
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const { Schema } = mongoose;

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

let exerciseSessionSchema = new Schema({
  description: {type: String, require:true},
  duration: {type: Number, required: true},
  date: String
});

let userSchema = new Schema({
  username: {type: String, required: true},
  log: [exerciseSessionSchema]
});


let Session = mongoose.model('Session', exerciseSessionSchema);

let User = mongoose.model('User',userSchema);

app.post("/api/users",bodyParser.urlencoded({extended: true}),function (req,res) {
  let newUser = new User({username: req.body.username});

  newUser.save((error,savedUser) =>{
    if(!error)
    {
      let responseObject = {};
      responseObject['username'] = savedUser.username;
      responseObject['_id'] = savedUser.id;
      res.json(responseObject);
    }
  })

});

app.get('/api/users', (req,res) =>{

  User.find({},(error,arrayOfUsers)=>{
    if(!error)
    {
      res.json(arrayOfUsers);
    }
  });
});

app.post("/api/users/:_id/exercises", bodyParser.urlencoded({extended:true}),(req,res)=>{
  console.log(req.body);
  let newSession = new Session({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  });

  if(newSession.date ===""){
    newSession.date = new Date().toISOString().substring(0,10);
  }

  User.findByIdAndUpdate(
    req.body[":_id"],
    {$push :{log: newSession}},
    {new:true},
    (error,updatedUser)=>{
      let responseObject = {};
      responseObject[':_id'] = updatedUser._id;
      responseObject['username'] = updatedUser.username;
      responseObject['date'] = new Date(newSession.date).toDateString();
      responseObject['description']= newSession.description;
      responseObject['duration'] = newSession.duration;
      res.json(responseObject);
    }
  );
});

app.get("/api/exercise/log", (req,res)=>{
  
  User.findById(req.query.userId, (error,result)=>{
    if(!error){
      let responseObject = result;

    
      if(req.query.from || req.query.to){
        let fromDate = new Date(0);
        let toDate = new Date();

        if(req.query.from)
        {
          fromDate = new Date(req.query.from);
        }
        if(req.query.to){
          toDate = new Date(req.query.to);
        }

        fromDate = fromDate.getTime();
        toDate = toDate.getTime();

        responseObject.log = responseObject.log.filter((session) =>{
            let sessionDate = new Date(session.date).getTime();

            return sessionDate >= fromDate && sessionDate <= toDate
        });
      }
      
      if(req.query.limit){
        responseObject.log = responseObject.log.slice(0, req.query.limit);
      }

      responseObject['count'] = result.log.length;
      res.json(responseObject);
      console.log(responseObject);
    }
  });
  console.log(req.query);
});