const { DateTime }= require('luxon');
const { LogService } = require('@jacktaylorgroup/upstream-logging');

const jwt = require('jsonwebtoken');
const axios = require('axios');
var path = require('path');
const database = require('../services/database');

const MONDAY_SIGNING_SECRET = process.env.MONDAY_SIGNING_SECRET;
const logger = new LogService();

const authorise = async(req, res) => {
    logger.log("authentication-controller.authoriseMonday - Attempt to authorise user", req, 'info')
    const {token} = req.query;
    
    try {
        const { accountId, userId, backToUrl } = jwt.verify( token, MONDAY_SIGNING_SECRET);
        logger.log("authentication-controller.authoriseMonday - Authorise user", req, 'info', { accountId, userId})

        let user = await database.findUser(userId, accountId);

        //no users have been saved, create a new user
        if (!user) {
            user = await database.createUser({
                accountId,
                userId
            });
            logger.log("authentication-controller.authoriseMonday - Created new user for monday.com account", req, 'info', { accountId, userId })
        } else if (user.harvestAccessToken) { //Need to get a harvest access token
            if (!user.cookieAcceptance) {
                logger.log('authentication-controller.authoriseMonday - Redirect to cookie consent page', req, 'info', { accountId, userId });
                return res.render('cookie-consent', { token });
            }

            logger.log("authentication-controller.authoriseMonday - Successfully authorised, redirect to monday.com", req, 'info', { accountId, userId })
            return res.redirect(backToUrl);
        }

        if (!user.cookieAcceptance) {
            logger.log('authentication-controller.authoriseMonday - Redirect to cookie consent page', req, 'info', { accountId, userId });
            return res.render('cookie-consent', { token });
        } else {
            logger.log("authentication-controller.authoriseMonday - Redirect to harvest authorisation", req, 'info', { accountId, userId})
            return res.cookie('token', token).redirect(`https://id.getharvest.com/oauth2/authorize?client_id=${process.env.HARVEST_CLIENT_ID}&response_type=code&state=${token}`)
        }
    } catch (err) {
        logger.error("authentication-controller.authoriseMonday - Error occured while validating monday token", req, err);
        return res.sendFile(path.resolve(__dirname, '../../views/error.html'));
    }
}

const harvestCallback = async(req, res) => {
    try {

        const cookieToken = req.cookies.token
        const { state, code } = req.query;

        try {
            jwt.verify( cookieToken, MONDAY_SIGNING_SECRET);
            if ( cookieToken !== state) {
                logger.log("authentication-controller.harvestCallback - State token does not match cookie token", req, 'info',);
                return res.sendFile(path.resolve(__dirname, '../../views/error.html'));
            }
        } catch (err) {
            logger.error("authentication-controller.harvestCallback - Error occured while validating auth token", req, err );
            return res.sendFile(path.resolve(__dirname, '../../views/error.html'));
        }

        const { accountId, userId, backToUrl } = jwt.verify( cookieToken, MONDAY_SIGNING_SECRET);
        
        let user = await database.findUser(userId, accountId);

        if (!user) {
            logger.log("authentication-controller.harvestCallback - Invalid user provided in callback", req, 'info');
            return res.sendFile(path.resolve(__dirname, '../../views/error.html'));
        }

        try {
            const tokenRequest = await axios.post('https://id.getharvest.com/api/v2/oauth2/token', {
                code,
                client_id: process.env.HARVEST_CLIENT_ID,
                client_secret: process.env.HARVEST_CLIENT_SECRET,
                grant_type: 'authorization_code'
            })

            await database.updateUser(user, {
                harvestAccessToken: tokenRequest.data.access_token,
                harvestRefreshToken: tokenRequest.data.refresh_token,
                harvestTokenExpiresAt: DateTime.now().plus({seconds: tokenRequest.data.expires_in - 60}).toISO(),
            })
            
            logger.log('authentication-controller.harvestCallback - Successfully authorised Harvest, redirecting to monday.com', req, 'info');
            return res.redirect(backToUrl);

        } catch (err) {
            logger.error("authentication-controller.harvestCallback - Error occured while validating authorisation code", req, err );
            return res.sendFile(path.resolve(__dirname, '../../views/error.html'));
        }
    } catch (err) {
        logger.error("authentication-controller.harvestCallback - Error occured while validating auth token", req, err );
    }
}

const updateCookieAcceptance = async (req, res) => {
    const { token } = req.body;
    try {
        const { accountId, userId, backToUrl } = jwt.verify( token, MONDAY_SIGNING_SECRET);
        logger.log('authentication-controller.updateCookieAcceptance - Attempt to update cookie acceptance of user', req, 'info', { accountId, userId });
        const user = await database.findUser(userId, accountId);
        if (!user) {
            logger.log('authentication-controller.updateCookieAcceptance - User not found', req, 'info', { userId, accountId });
            return res.status(400).send('Invalid state, please try again');
        }
        await database.updateUser(user, { cookieAcceptance: true });

        logger.log("authentication-controller.authoriseMonday - Redirect to harvest authorisation", req, 'info', { accountId, userId})
        return res.cookie('token', token).send({oauthUrl: `https://id.getharvest.com/oauth2/authorize?client_id=${process.env.HARVEST_CLIENT_ID}&response_type=code&state=${token}`});
    } catch (err) {
        logger.error('authentication-controller.updateCookieAcceptance - Error occured while updating cookie acceptance', req, err );
        return res.sendFile(path.resolve(__dirname, '../../views/error.html'));
    }
};

const refreshHarvestTokenCron = async () => {
    logger.log("authentication-controller.refreshHarvestTokenCron - Attempt to refresh harvest tokens", null, 'info')
    const expirationTime = DateTime.now().plus({minutes: 30}).toISO();
    const harvestUsers = await database.findHarvestUsers(expirationTime);
    harvestUsers.forEach(async (user) => {
        logger.log("authentication-controller.refreshHarvestTokenCron - Refreshing token for user", null, 'info', { userId: user.userId, accountId: user.accountId })
        try {
            const tokenRequest = await axios.post('https://id.getharvest.com/api/v2/oauth2/token', {
                refresh_token: user.harvestRefreshToken,
                client_id: process.env.HARVEST_CLIENT_ID,
                client_secret: process.env.HARVEST_CLIENT_SECRET,
                grant_type: 'refresh_token'
            })

            await database.updateUser(user, {
                harvestAccessToken: tokenRequest.data.access_token,
                harvestRefreshToken: tokenRequest.data.refresh_token,
                harvestTokenExpiresAt: DateTime.now().plus({seconds: tokenRequest.data.expires_in - 60}).toISO(),
            })
            logger.log("authentication-controller.refreshHarvestTokenCron - Successfully refreshed token for user", null, 'info', { userId: user.userId, accountId: user.accountId })
        } catch (err) {
            logger.log("authentication-controller.refreshHarvestTokenCron - Error occured while refreshing token", null, 'error', { error: err, userId: user.userId, accountId: user.accountId });
        }
    });
}


module.exports = {
    authorise,
    harvestCallback,
    // mondayCallback,
    updateCookieAcceptance,
    refreshHarvestTokenCron,
};