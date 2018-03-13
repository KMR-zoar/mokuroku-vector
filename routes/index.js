const express = require('express');
const router = express.Router();

const sphericalmercator = require('@mapbox/sphericalmercator');
const merc = new sphericalmercator();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./mokuroku.sqlite');

const moment = require('moment');
const url = require('url');

createGeoJSON = (date, time, unixtime, path, coordinates) => {
   let result = require('../template.json');
   result.features[0].properties.date = date;
   result.features[0].properties.time = time;
   result.features[0].properties.unixtime = unixtime;
   result.features[0].properties.tilePath = path;
   result.features[0].geometry.coordinates = coordinates;

   return result;
}

router.get('/', function(req, res, next) {
   var accessUrl = req.protocol + "://" +
      req.get('host') + req.originalUrl;
   res.render('index', {
      title: 'Mokuroku-Vector',
      url: accessUrl
   });
});

router.get('/:z/:x/:y.json', (req, res, next) => {
   const tileParam = req.params;
   const wsen = merc.bbox(tileParam.x, tileParam.y, tileParam.z);
   const coordinates = [[
      [wsen[0], wsen[3]],
      [wsen[2], wsen[3]],
      [wsen[2], wsen[1]],
      [wsen[0], wsen[1]],
      [wsen[0], wsen[3]]
   ]];
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

         result = createGeoJSON(updateDate, updateTime, result.unixtime, path, coordinates);

         res.json(result);
      });
   });
});

module.exports = router;
