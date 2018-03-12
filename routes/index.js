const express = require('express');
const router = express.Router();
const sphericalmercator = require('@mapbox/sphericalmercator');
const merc = new sphericalmercator();

/* GET home page. */
router.get('/', function(req, res, next) {
   res.render('index', { title: 'Express' });
});

router.get('/:z/:x/:y.json', (req, res, next) => {
   const tileParam = req.params;
   const wsen = merc.bbox(tileParam.x, tileParam.y, tileParam.z);
   const path = tileParam.z + "/" + tileParam.x + "/" + tileParam.y + ".png";
   console.log(path);
   res.json({
      "x": tileParam.x
   });
});

module.exports = router;
