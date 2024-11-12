const { LogService } = require('@jacktaylorgroup/upstream-logging');

const jwt = require('jsonwebtoken');
const database = require('../services/database');

const logger = new LogService();

async function validateMondayRequest(req, res, next) {

    try {
        let { authorization } = req.headers;

        if (!authorization) {
            logger.log('authentication-middleware.validateMondayRequest - no token provided', req, 'warn', {
                remediation: 'Authorizaion token should be in authorization headder'
            });
            return res.status(401).json({ error: 'Not authenticated' });
        }
        try {
            const { accountId, userId, shortLivedToken, subscription } = jwt.verify(authorization, process.env.MONDAY_SIGNING_SECRET);
              
            let user = await database.findUser(userId, accountId);
            if (!user) {
                logger.log('authentication-middleware.validateMondayRequest - no user found in the database', req, 'warn', {
                    remediation: 'User should follow the authorisation process'
                });
                return res.status(401).json({ error: 'Not authenticated' });
            }
            req.session = { accountId: accountId, userId: userId, shortLivedToken: shortLivedToken, user: user };

            // if (subscription && subscription.plan_id) {
            //     logger.log('authentication-middleware.validateMondayRequest - Success - valid subscription found');
            //     next();
            // } else { //Some apps may require external billing
            //     logger.log('authentication-middleware.validateMondayRequest - No valid subscription has been found');
            //     return res.status(400).send({
            //         "severityCode" : 4000,
            //         "notificationErrorTitle": "No subscription",
            //         "notificationErrorDescription": "No subscription has been found, please purchase through the Apps Marketplace",
            //         "runtimeErrorDescription": "No subscription has been found, please purchase through the Apps Marketplace",
            //     });
            // }
            next();
        } catch (err) {
            logger.error('authentication-middleware.validateMondayRequest - request authorisation has failed', req, err);
            return res.status(401).json({ error: 'Not authenticated' });
        }

    } catch (err) {
        logger.error('authentication-middleware.validateMondayRequest - an unknown error has occured', req, err);
        return res.status(401).json({ error: 'Not authenticated' });
    }
}

async function validateMondayFieldRequest(req, res, next) {

    try {
      let { authorization } = req.headers;
  
      if (!authorization) {
        logger.log('authentication-middleware.validateMondayFieldRequest - no token provided', 'req', 'warn', { remediation: 'Authorizaion token should be in authorization headder' });
        return res.status(401).json({ error: 'Not authenticated' });
      }
      try {
        jwt.verify(authorization, process.env.MONDAY_SIGNING_SECRET);
        next();
      } catch (err) {
        logger.error('authentication-middleware.validateMondayFieldRequest - request authorisation has failed', req, err );
        return res.status(401).json({ error: 'Not authenticated' });
      }
  
    } catch (err) {
      logger.error("authentication-middleware.validateMondayRequest - an unknown error has occured", req, err );
      return res.status(401).json({ error: 'Not authenticated' });
    }
  
  }

module.exports = {
    validateMondayRequest,
    validateMondayFieldRequest,
};
