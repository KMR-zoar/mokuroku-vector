const express = require('express');
const router = express.Router();

const sphericalmercator = require('@mapbox/sphericalmercator');
const merc = new sphericalmercator();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./mokuroku.sqlite');

const moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
   res.render('index', { title: 'Express' });
});

router.get('/:z/:x/:y.json', (req, res, next) => {
   const tileParam = req.params;
   const wsen = merc.bbox(tileParam.x, tileParam.y, tileParam.z);
   const path = tileParam.z +
      "/" + tileParam.x +
      "/" + tileParam.y + ".png";
   
   db.serialize(() => {
      db.get(
         'SELECT unixtime FROM mokuroku WHERE path = ?',
         path,
         (err, result) => {
         if (err) throw err;
         const updateTime = moment
            .unix(result.unixtime)
            .format('HH:mm:ss');
         const updateDate = moment
            .unix(result.unixtime)
            .format('YYYY-MM-DD');

         
      });
   });
   res.json({
      "x": tileParam.x,
      "y": tileParam.y
   });
});

module.exports = router;
