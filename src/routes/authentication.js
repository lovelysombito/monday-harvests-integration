const express = require('express');

const authenticationController = require('../controllers/authentication-controller');

const router = express.Router();

router.get('/authorise', authenticationController.authorise);
router.post('/authorise/update-cookie-consent', authenticationController.updateCookieAcceptance);
// router.get('/monday/callback', authenticationController.mondayCallback);
router.get('/harvest/callback', authenticationController.harvestCallback);

module.exports = router;

