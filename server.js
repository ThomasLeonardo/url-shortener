var express = require('express');
var mongodb = require('mongodb')
var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var config = require('./config')

var app = express();

mongoose.connect("mongodb://" + config.db.host + '/' + config.db.name)

var CounterSchema = Schema({
    _id: {type: String, required: true},
    seq: { type: Number, default: 0 }
});

// create a model from that schema
var counter = mongoose.model('counter', CounterSchema);

// create a schema for our links
var urlSchema = new Schema({
  _id: {type: Number, index: true},
  long_url: String,
  created_at: Date
});

// The pre('save', callback) middleware executes the callback function
// every time before an entry is saved to the urls collection.
urlSchema.pre('save', function(next){
  var doc = this;
  console.log(doc)
  // find the url_count and increment it by 1
  counter.findByIdAndUpdate({_id: 'url_count'}, {$inc: {seq: 1} }, function(error, counter) {
      if (error)
          return next(error);
      // set the _id of the urls collection to the incremented value of the counter
      doc._id = counter.seq;
      doc.created_at = new Date();
      if(!doc.long_url.startsWith("http://")){
      		doc.long_url = "http://" + doc.long_url
      }
      next();
  });
});

var Url = mongoose.model('Url', urlSchema);


var alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
var base = alphabet.length; // base is the length of the alphabet (58 in this case)

// utility function to convert base 10 integer to base 58 string
function encode(num){
  var encoded = '';
  while (num){
    var remainder = num % base;
    num = Math.floor(num / base);
    encoded = alphabet[remainder].toString() + encoded;
  }
  return encoded;
}

// utility function to convert a base 58 string to base 10 integer
function decode(str){
  var decoded = 0;
  while (str){
    var index = alphabet.indexOf(str[0]);
    var power = str.length - 1;
    decoded += index * (Math.pow(base, power));
    str = str.substring(1);
  }
  return decoded;
}

app.get('/', function(req, res){
	res.send("hello")
})

app.get('/:encoded(\\w+)',function(req, res){
	var encoded = req.params.encoded
	var id = decode(encoded)
	Url.findOne({_id: id}, function(err, doc){
		console.log(doc)
		if(doc){
			res.writeHead(301,
  				{Location: doc.long_url}
			);
			res.end();
		}
		else{
			console.log("Does not exist")
			res.redirect(config.webhost)
		}
	});
})

app.get('/new/:url', function(req, res){ 
	var patt = /((?:https?:\/\/)?(?:www\.)?\w+?\.\w+(?:.+)?)/
	var longUrl = req.params.url;
	var shortUrl = '';

	if(!patt.test(req.params.url)){
		res.send({'original_url': longUrl, 'error': 'Url is not valid'})
	}
	console.log(req.params.url)
	// check if url already exists in database
	Url.findOne({long_url: longUrl}, function (err, doc){
		if (doc){
		 	// URL has already been shortened
		 	shortUrl = config.webhost + encode(doc._id);
		 	res.send({'original_url': longUrl, 'short_url': shortUrl})

		} else {
			// The long URL was not found in the long_url field in our urls
		 	// collection, so we need to create a new entry
		 	var newUrl = Url({
		 		long_url: longUrl
		 	})

		 	newUrl.save(function(err){
		 		if(err){
		 			console.log(err)
		 		}
		 		else{
		 			shortUrl = config.webhost + encode(newUrl._id)		
		 			res.send({'original_url': longUrl, 'short_url': shortUrl})
		 		}
		 	})
		}
	});
})

var port = process.env.PORT || 8000

app.listen(port, function(){
	console.log('Listening on port ' + port)
})