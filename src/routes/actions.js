const express = require('express');

const validateRequest = require('../middleware/authentication').validateMondayRequest;
const actionController = require('../controllers/action-controller');

const router = express.Router();
router.post('/actions/create-client', validateRequest, actionController.createClient);
router.post('/actions/create-project-connected-client', validateRequest, actionController.createProjectConnectedClient);
router.post('/actions/create-project-connected-client-subitem-tasks', validateRequest, actionController.createProjectConnectedClientSubitemTasks);
router.post('/actions/create-project-client-mapped', validateRequest, actionController.createProjectMappedClient);
// router.post('/actions/create-project-connected-client-sync', validateRequest, actionController.createProjectConnectedClientSync);
// router.post('/actions/create-project-connected-client-subitem-tasks-sync', validateRequest, actionController.createProjectConnectedClientSubitemTasksSync);
// router.post('/actions/create-project-client-mapped-sync', validateRequest, actionController.createProjectMappedClientSync);
router.post('/actions/create-task-connected-project', validateRequest, actionController.createTaskConnectedProject);
router.post('/actions/create-timesheet-item', validateRequest, actionController.createTimesheetItem);
router.post('/actions/create-timesheet-item-connect-task', validateRequest, actionController.createTimesheetItemConnectTask);
router.post('/actions/update-task-reported-time', validateRequest, actionController.updateTaskReportedTime);
router.post('/actions/update-subitem-reported-time', validateRequest, actionController.updateTaskReportedTimeSubitem);
router.post('/actions/create-expense', validateRequest, actionController.createExpense);
router.post('/actions/create-expense-item', validateRequest, actionController.createExpenseItem);
router.post('/actions/create-expense-item-files', validateRequest, actionController.createExpenseItemWithFile);

module.exports = router;

