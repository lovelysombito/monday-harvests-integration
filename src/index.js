const { LogService } = require('@jacktaylorgroup/upstream-logging');

const express = require('express');
const nodeCron = require('node-cron');
// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const routes = require('./routes');

const { refreshHarvestTokenCron } = require('./controllers/authentication-controller');
const { fetchUpdatedTimeEntries, fetchTaskTimeReportedEntries, fetchUpdatedExpenses } = require('./controllers/harvest-controller');


const logger = new LogService();
const app = express();
const port = process.env.PORT;

// Create express router and load routes
app.use((req, res, next) => {
    req.locals = { source: 'monday' };
    next();
});
logger.addRequestId(app);

app.set('view engine', 'ejs');
app.use(cors());
app.use(cookieParser());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(routes);

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`Harvest by Luxie Tech listening at http://localhost:${port}`));

const harvestRefreshSchedule = '0,10,30 * * * *';
nodeCron.schedule(harvestRefreshSchedule, refreshHarvestTokenCron, {
    scheduled: true,
});

const harvestFetchSchedule = '0,15,30,45 * * * *';
nodeCron.schedule(harvestFetchSchedule, fetchUpdatedTimeEntries, {
    scheduled: true,
});

nodeCron.schedule(harvestFetchSchedule, fetchTaskTimeReportedEntries, {
    scheduled: true,
});

nodeCron.schedule(harvestFetchSchedule, fetchUpdatedExpenses, {
    scheduled: true,
});

// fetchUpdatedTimeEntries();
// fetchTaskTimeReportedEntries();

module.exports = app;
