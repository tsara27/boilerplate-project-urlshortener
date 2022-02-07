require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const dns = require("dns");
const app = express();
const mongoose = require("mongoose");
const { Schema } =  mongoose;

// Connect to mongo server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

// Config body parser
app.use(bodyParser.urlencoded({ extended: false }));

// Initiate URL Shortener Schema
const shortenSchema = new Schema({
  original_url: { type: String, required: true, unique: true },
  short_url: Number
});

let ShortenURL = mongoose.model('ShortenURL', shortenSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl", function(req, res, next) {
  dns.lookup(req.body.url, function(err, host) {
    if (err) {
      return res.json({
        error: "Invalid URL"
      });
    }
    req.original_url = req.body.url;
    next();
  });
}, function(req, res, next) {
  ShortenURL.findOne({ original_url: req.original_url }, function(err, data) {
    req.existingURL = data;
    next();
  });
}, function(req, res) {
  if (req.existingURL != null) {
    const url = JSON.stringify(req.existingURL, ["original_url", "short_url"]);

    return res.json(JSON.parse(url));
  }

  const newShorten = new ShortenURL({
    original_url: req.original_url,
    short_url: Math.floor(new Date)
  });

  newShorten.save(function(err, data) {
    if (err) {
      return res.json({
        error: err
      });
    }

    const url = JSON.stringify(data, ["original_url", "short_url"]);

    res.json(JSON.parse(url));
  });
});

app.get("/api/shorturl/:short_url", function(req, res) {
  ShortenURL.findOne({ short_url: req.params.short_url }, function(err, data) {
    if (err) {
      return res.json({
        error: err
      });
    }

    res.writeHead(301, {
      Location: `https://` + data.original_url
    }).end();
  });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
