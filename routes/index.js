const express = require('express');
const router = express.Router();

const sphericalmercator = require('@mapbox/sphericalmercator');
const merc = new sphericalmercator();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./mokuroku.sqlite');

const moment = require('moment');

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
   res.render('index', { title: 'Express' });
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

         res.setHeader('Access-Control-Allow-Origin', 'http://mokuroku.pgw.jp:3000/');
         res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
         res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
         res.setHeader('Access-Control-Allow-Credentials', true);
         res.json(result);
      });
   });
});

module.exports = router;
