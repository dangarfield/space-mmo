var express = require('express');
var randomgraph = require('randomgraph');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('game', {
    title: 'Express',
  });
});

module.exports = router;