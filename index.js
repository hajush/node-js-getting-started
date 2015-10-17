var pg = require('pg');
var express = require('express');
var cool = require('cool-ascii-faces');
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/cool', function(request, response) {
  var result = ''
  var times = process.env.TIMES || 5
  for (i=0; i < times; i++)
    result += cool() + "<br/>\n";
  response.send(result);
});

app.get('/db', function (request, response) {
  console.log("Database URL: " + process.env.DATABASE_URL);
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } };  
var mongodbUri = process.env.MONGOLAB_URI;
var mongooseUri = uriUtil.formatMongoose(mongodbUri);

// Create song schema
var songSchema = mongoose.Schema({
  decade: String,
  artist: String,
  song: String,
  weeksAtOne: Number
});

// Store song documents in a collection called "songs"
var Song = mongoose.model('songs', songSchema);
var mdb = mongoose.connection;

mdb.on('error', console.error.bind(console, 'connection error:'));

mdb.once('open', function callback () {

  // Create seed data
  var seventies = new Song({
    decade: '1970s',
    artist: 'Debby Boone',
    song: 'You Light Up My Life',
    weeksAtOne: 10
  });

  var eighties = new Song({
    decade: '1980s',
    artist: 'Olivia Newton-John',
    song: 'Physical',
    weeksAtOne: 10
  });

  var nineties = new Song({
    decade: '1990s',
    artist: 'Mariah Carey',
    song: 'One Sweet Day',
    weeksAtOne: 16
  });

  /*
   * First we'll add a few songs. Nothing is required to create the 
   * songs collection; it is created automatically when we insert.
   */
  seventies.save();
  eighties.save();
  nineties.save();
});

app.get('/mongodb', function (request, response) {
  console.log("Mongo URI: " + mongooseUri);
  mongoose.connect(mongooseUri, options);
  Song.find({}, function(err, songs){
    if(err){
      console.log(err);
      res.send("Error: " + err);
    } else {
      res.render('pages/db', {results: songs} );
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


