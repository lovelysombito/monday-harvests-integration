const express = require('express');

const authenticationRoutes = require('./authentication');
const actionRoutes = require('./actions');
const fieldRoutes = require('./fields');
const subscriptionRoutes = require('./subscriptions');

const router = express.Router();

router.use(authenticationRoutes);
router.use(actionRoutes);
router.use(fieldRoutes);
router.use(subscriptionRoutes);

// Place holder to confirm server is available
router.get('/', async function(req, res) {
    return res.status(200).send({message:`You have reached the home page of ${process.env.APP_NAME}`});
});

// Required for marketplace domain ownership verification
router.get('/monday-app-association.json', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({
        "apps":[
            {"clientID": process.env.MONDAY_CLIENT_ID}
        ]
    }));
});

module.exports = router;