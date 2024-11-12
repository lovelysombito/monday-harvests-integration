const express = require('express');

const validateRequest = require('../middleware/authentication').validateMondayRequest;
const subscriptionController = require('../controllers/subscription-controller');

const router = express.Router();
router.post('/subscriptions/timesheet-updates/subscribe', validateRequest, subscriptionController.subscribeTimesheetUpdates);
router.post('/subscriptions/timesheet-updates/unsubscribe', validateRequest, subscriptionController.unsubscribeTimesheetUpdates);

router.post('/subscriptions/timesheet-updates-projectboard/subscribe', validateRequest, subscriptionController.subscribeTimesheetUpdatesProjectBoard);
router.post('/subscriptions/timesheet-updates-projectboard/unsubscribe', validateRequest, subscriptionController.unsubscribeTimesheetUpdatesProjectBoard);

router.post('/subscriptions/task-time-reported-updated/subscribe', validateRequest, subscriptionController.subscribeTaskTimeReportedUpdated);
router.post('/subscriptions/task-time-reported-updated/unsubscribe', validateRequest, subscriptionController.unsubscribeTaskTimeReportedUpdated);

router.post('/subscriptions/task-time-reported-updated-subitem/subscribe', validateRequest, subscriptionController.subscribeTaskTimeReportedUpdatedSubitem);
router.post('/subscriptions/task-time-reported-updated-subitem/unsubscribe', validateRequest, subscriptionController.unsubscribeTaskTimeReportedUpdatedSubitem);

router.post('/subscriptions/expense-updates/subscribe', validateRequest, subscriptionController.subscribeExpensesUpdated);
router.post('/subscriptions/expense-updates/unsubscribe', validateRequest, subscriptionController.unsubscribeExpensesUpdated);

module.exports = router;

