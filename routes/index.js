const express = require('express');
const router = express.Router();

const sphericalmercator = require('@mapbox/sphericalmercator');
const merc = new sphericalmercator();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./mokuroku.sqlite');

const moment = require('moment');
const canvas = require('canvas');

createGeoJSON = (date, time, unixtime, path, coordinates) => {
  let result = require('../template.json');
  result.features[0].properties.date = date;
  result.features[0].properties.time = time;
  result.features[0].properties.unixtime = unixtime;
  result.features[0].properties.tilePath = path;
  result.features[0].geometry.coordinates = coordinates;

  return result;
};

const GeoJSONCreater = (sqlResult, coordinates, path) => {
  let unixtime;
  let updateTime;
  let updateDate;

  if (sqlResult) {
    unixtime = sqlResult.unixtime;
    updateTime = moment.unix(unixtime).format('HH:mm:ss');
    updateDate = moment.unix(unixtime).format('YYYY-MM-DD');
  } else {
    unixtime = null;
    updateTime = '目録が存在しないエリアです';
    updateDate = '';
  }

  funcResult = createGeoJSON(
    updateDate,
    updateTime,
    unixtime,
    path,
    coordinates
  );
  return funcResult;
};

const PNGCreater = (sqlResult, callback) => {
  let unixtime;
  let updateTime;
  let updateDate;
  let text;

  if (sqlResult) {
    unixtime = sqlResult.unixtime;
    updateTime = moment.unix(unixtime).format('HH:mm:ss');
    updateDate = moment.unix(unixtime).format('YYYY-MM-DD');

    text =
      'date: ' +
      updateDate +
      '\n' +
      'time: ' +
      updateTime +
      '\n' +
      'unixtime: ' +
      unixtime;
  } else {
    text = '\n目録が存在しないエリアです';
  }

  const vCanvas = canvas.createCanvas(256, 256);
  const ctx = vCanvas.getContext('2d');

  canvas.loadImage('./routes/background.png').then(image => {
    ctx.drawImage(image, 0, 0, 256, 256);
    ctx.font = '15px Impact';
    ctx.fillStyle = 'green';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineTo(0, 256);
    ctx.stroke();
    ctx.fillText(text, 30, 110);
    callback(vCanvas.toDataURL('image/png'));
  });
};

router.get('/', function(req, res, next) {
  var accessUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.render('index', {
    title: 'Mokuroku-Vector',
    url: accessUrl
  });
});

router.get('/:z/:x/:y.:format', (req, res, next) => {
  const tileParam = req.params;
  const wsen = merc.bbox(tileParam.x, tileParam.y, tileParam.z);
  const coordinates = [
    [
      [wsen[0], wsen[3]],
      [wsen[2], wsen[3]],
      [wsen[2], wsen[1]],
      [wsen[0], wsen[1]],
      [wsen[0], wsen[3]]
    ]
  ];
  const path = tileParam.z + '/' + tileParam.x + '/' + tileParam.y + '.png';

  db.serialize(() => {
    db.get(
      'SELECT unixtime FROM mokuroku WHERE path = ?',
      path,
      (err, result) => {
        if (err) throw err;

        if (req.params.format === 'json') {
          const funcResult = GeoJSONCreater(result, coordinates, path);
          res.json(funcResult);
        } else if (req.params.format === 'png') {
          PNGCreater(result, image => {
            const imageBody = image.split(',')[1];
            const img = Buffer.from(imageBody, 'base64');
            res.writeHead(200, {
              'Content-Type': 'image/png',
              'Content-Length': img.length
            });
            res.end(img);
          });
        } else {
          res.status(404).send('Not Found');
        }
      }
    );
  });
});

module.exports = router;
