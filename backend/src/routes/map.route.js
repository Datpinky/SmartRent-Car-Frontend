const express = require('express');
const mapController = require('../controllers/map.controller');
const router = express.Router();

router.get(
  '/forwardGeocode',
  mapController.forward
);

router.get(
  '/reverseGeocode',
  mapController.reverse
);

router.get(
  '/placeAutocomplete',
  mapController.autocomplete
);

router.get(
  '/directions',
  mapController.directions
);



module.exports = router;