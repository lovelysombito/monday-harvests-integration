const express = require('express');

const validateRequest = require('../middleware/authentication').validateMondayFieldRequest;
const validateAuthRequest = require('../middleware/authentication').validateMondayRequest;
const fieldController = require('../controllers/field-controller');

const router = express.Router();
router.post('/fields/get/client', validateRequest, fieldController.getClientFields);
router.post('/fields/post/client', validateRequest, fieldController.postClientFields);
router.post('/fields/get/project', validateRequest, fieldController.getProjectFields);
router.post('/fields/post/project', validateRequest, fieldController.postProjectFields);
router.post('/fields/post/project-connected-client', validateRequest, fieldController.postProjectConnectedClientFields);
router.post('/fields/get/timesheet', validateRequest, fieldController.getTimesheetFields);
router.post('/fields/post/task', validateRequest, fieldController.postTaskFields);
router.post('/fields/post/project-mapped-client', validateRequest, fieldController.postProjectMappedClientFields);
router.post('/fields/get/taskReportedTime', validateRequest, fieldController.getTaskReportedTimeFields);
router.post('/fields/get/subitemboard', validateAuthRequest, fieldController.getSubitemBoardId);
router.post('/fields/post/expense', validateRequest, fieldController.postExpenseFields);
router.post('/fields/get/expense', validateRequest, fieldController.getExpenseFields);

module.exports = router;

