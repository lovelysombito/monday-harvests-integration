const { DateTime } = require('luxon');
const { LogService } = require('@jacktaylorgroup/upstream-logging');

const harvest = require('../services/harvest');
const database = require('../services/database');
const axios = require('axios');

const logger = new LogService();

const fetchUpdatedTimeEntries = async () => {
    try {
        logger.log('harvest-controller.fetchUpdatedTimeEntries - Fetching updated time entries subscriptions', null, 'info')
        
        const updatedSinceTime = DateTime.now().minus({minutes : 60}).toUTC().toISO();
        const updatedTimeEntrySubscriptions = await database.findTimeEntryUpdatedSubscriptions();

        const userIds = [];
        updatedTimeEntrySubscriptions.forEach(subscription => {
            if (!userIds[subscription.usersId]) {
                userIds[subscription.usersId] = [subscription];
            } else {
                userIds[subscription.usersId].push(subscription);
            }
        });

        logger.log('harvest-controller.fetchUpdatedTimeEntries - Process user subscriptions', null, 'info')

        // loop through each userIds
        for (const userId in userIds) {
            if (userIds.hasOwnProperty(userId)) {
                try {
                    const subscriptions = userIds[userId];
                    const harvestAccessToken = subscriptions[0].harvestAccessToken;
                    
                    let nextPage = null;
                    let timesheets = [];
                    try {
                        do {
                            const pagedTimeSheets = await harvest.getTimeEntries(harvestAccessToken, nextPage, `updated_since=${updatedSinceTime}`);
                            if (pagedTimeSheets.time_entries.length > 0) {
                                timesheets = timesheets.concat(pagedTimeSheets.time_entries);
                            }

                            if (pagedTimeSheets.next_page) {
                                nextPage = pagedTimeSheets.next_page;
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } else {
                                nextPage = null;
                            }
                        } while (nextPage);
                    } catch (err) {
                        logger.log('harvest-controller.fetchUpdatedTimeEntries - An error has occured fetching updated time entries: ' + err.message, null, 'error', { updatedSinceTime });
                        return;
                    }

                    logger.log('harvest-controller.fetchUpdatedTimeEntries - Process timesheets', null, 'info')
                    timesheets.forEach(async (timesheet) => {
                        const timesheetObj = { ...timesheet };
                        delete timesheetObj.user;
                        delete timesheetObj.client;
                        delete timesheetObj.project;
                        delete timesheetObj.task;
                        delete timesheetObj.user_assignment;
                        delete timesheetObj.task_assignment;

                        timesheetObj.client = timesheet.client.name;
                        timesheetObj.project = timesheet.project.name;
                        timesheetObj.project_code = timesheet.project.code;
                        timesheetObj.task = timesheet.task.name;
                        timesheetObj.user_name = timesheet.user.name;

                        if (timesheet.user.id) {
                            try {
                                const harvestUser = await harvest.getUser(harvestAccessToken, timesheet.user.id);
                                timesheetObj.user_emails = { identifierType: "email", identifierValue: [harvestUser.email] };
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } catch (err) {
                                logger.log('harvest-controller.fetchUpdatedTimeEntries - Error fetching user from Harvest: ' + err.message, null, 'error', {
                                    error: err,
                                    timesheet,
                                });
                            }
                        }

                        const payload = {
                            trigger: {
                                outputFields: {
                                    timeEntry: timesheetObj,
                                    taskId: timesheet.task?.id
                                }
                            }
                        }


                        subscriptions.forEach(async (subscription) => {

                            if (subscription.webhookEvent !== 'TIME_ENTRY_UPDATED' && subscription.webhookEvent !== 'TIME_ENTRY_UPDATED_PROJECT_BOARD') {
                                // Subscription is not for time entry updated
                                return;
                            }

                            if (subscription.webhookEvent === 'TIME_ENTRY_UPDATED_PROJECT_BOARD') {
                                const projectId = timesheet.project.id;
                                if (!subscription.context) {
                                    logger.log('harvest-controller.fetchUpdatedTimeEntries - Project board subscription missing context', null, 'info', {
                                        projectId,
                                        timesheet,
                                        subscription,
                                    });
                                    return;
                                }
                                const { projectBoardId } = JSON.parse(subscription.context);
                                const matchingProject = await database.findProjectItemByProjectId(subscription.accountId, projectBoardId, projectId);
                                if (!matchingProject) {
                                    logger.log('harvest-controller.fetchUpdatedTimeEntries - Project not found in selected board', null, 'info', {
                                        projectId,
                                        projectBoardId,
                                        timesheet,
                                        subscription,
                                    });
                                    return;
                                }
                            }

                            let success = false;
                            let count = 0;
                            let exception = null;
                            do {
                                if (count > 2) {
                                    logger.log("harvest-controller.fetchUpdatedTimeEntries - An error has occured sending the trigger to monday.com: " + exception.message, {
                                        data: exception.response.data,
                                        body: exception.response.body,
                                        status: exception.response.status,
                                        payload,
                                    });
                                    break;
                                }
                                count ++;
                                try {
                                    let { data } = await axios.post(subscription.webhookUrl, payload, { headers: { 'Authorization': process.env.MONDAY_SIGNING_SECRET } });
                                    success = true;
                                    logger.log("harvest-controller.fetchUpdatedTimeEntries - subscription "+subscription.subscriptionsId + " triggered - result: "+data.success + ' for event: ' + subscription.webhookEvent, null, 'info', { payload, fields: payload.trigger.outputFields });
                                } catch (err) {
                                    if (axios.isAxiosError(err) && err.response) {
                                        if (err.response.status !== 503) {
                                            logger.log("harvest-controller.fetchUpdatedTimeEntries - An error has occured sending the trigger to monday.com: " + err.message, null, 'error', {
                                                data: err.response.data,
                                                body: err.response.body,
                                                status: err.response.status,
                                                payload,
                                            });
                                        }
                                    } else {
                                        logger.error("harvest-controller.fetchUpdatedTimeEntries - An unknown error has occured: " + err.message, null, 'error', {
                                            payload,
                                            message: err.message,
                                            error: err,
                                        });
                                    }
                                }
                            } while (!success);
                        });
                    });
                } catch (err) {
                    logger.error('harvest-controller.fetchUpdatedTimeEntries - An error has occured fetching updated time entries: ' + err.message, null, err);
                }
            }
        }
    } catch (err) {
        logger.error('harvest-controller.fetchUpdatedTimeEntries - An error has occured fetching updated time entries: ' + err.message, null, err);
    }
}

const fetchTaskTimeReportedEntries = async () => {
    try {
        logger.log('harvest-controller.fetchTaskTimeReportedEntries - Fetching updated time entries subscriptions', null, 'info')
        
        const updatedSinceTime = DateTime.now().minus({minutes: 60}).toUTC().toISO();
        const taskTimeReportedSubscriptions = await database.findTaskTimeReportedSubscriptions();

        const userIds = [];
        taskTimeReportedSubscriptions.forEach(subscription => {
            if (!userIds[subscription.usersId]) {
                userIds[subscription.usersId] = [subscription];
            } else {
                userIds[subscription.usersId].push(subscription);
            }
        });

        logger.log('harvest-controller.fetchTaskTimeReportedEntries - Process user subscriptions', null, 'info')

        // loop through each userIds
        for (const userId in userIds) {
            if (userIds.hasOwnProperty(userId)) {
                try {
                    const subscriptions = userIds[userId];
                    const harvestAccessToken = subscriptions[0].harvestAccessToken;
                    
                    let nextPage = null;
                    let timesheets = [];
                    do {
                        const pagedTimeSheets = await harvest.getTimeEntries(harvestAccessToken, nextPage, `updated_since=${updatedSinceTime}`);
                        if (pagedTimeSheets.time_entries.length > 0) {
                            timesheets = timesheets.concat(pagedTimeSheets.time_entries);
                        }

                        if (pagedTimeSheets.next_page) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            nextPage = pagedTimeSheets.next_page;
                        } else {
                            nextPage = null;
                        }
                    } while (nextPage);

                    logger.log('harvest-controller.fetchTaskTimeReportedEntries - Process timesheets to get unique projects and tasks', null, 'info')

                    const uniqueProjectTasks = [];
                    timesheets.forEach((timesheet) => {
                        const projectTask = timesheet.project.id + '-' + timesheet.task.id;
                        if (!uniqueProjectTasks.includes(projectTask)) {
                            uniqueProjectTasks.push(projectTask);
                        }
                    });

                    logger.log('harvest-controller.fetchTaskTimeReportedEntries - Process unique projects and tasks', null, 'info')
                    uniqueProjectTasks.forEach(async (projectTask) => {
                        const [projectId, taskId] = projectTask.split('-');

                        const projectTaskAssignments = await database.findProjectTaskAssignmentByTaskAndProjectId(subscriptions[0].accountId, projectId, taskId);
                        if (!projectTaskAssignments || projectTaskAssignments.length === 0) {
                            // No project task assignment found
                            logger.log('harvest-controller.fetchTaskTimeReportedEntries - Project task assignment not found in database', null, 'info', { accountId: subscriptions[0].accountId, projectId, taskId });
                            return;
                        }

                        let projectTimesheets = [];
                        
                        try {
                            do {
                                const pagedTimeSheets = await harvest.getTimeEntries(harvestAccessToken, nextPage, `project_id=${projectId}&task_id=${taskId}`);
                                if (pagedTimeSheets.time_entries.length > 0) {
                                    projectTimesheets = projectTimesheets.concat(pagedTimeSheets.time_entries);
                                }

                                if (pagedTimeSheets.next_page) {
                                    nextPage = pagedTimeSheets.next_page;
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                } else {
                                    nextPage = null;
                                }
                            } while (nextPage);
                        } catch (err) {
                            logger.log('harvest-controller.fetchTaskTimeReportedEntries - An error has occured fetching project task time entries: ' + err.message, null, 'error', { projectId, taskId });
                            return;
                        }

                        let hours = 0;
                        let hoursWithoutTimer = 0;
                        let roundedHours = 0;
                        let earliestTime = DateTime.now().plus({days: 2});
                        let latestTime = DateTime.now().minus({days: 100});

                        projectTimesheets.forEach((timesheet) => {
                            const startTime = DateTime.fromISO(timesheet.spent_date);
                            const endTime = DateTime.fromISO(timesheet.spent_date);

                            if (startTime < earliestTime) {
                                earliestTime = startTime;
                            }

                            if (endTime > latestTime) {
                                latestTime = endTime;
                            }

                            hours += timesheet.hours;
                            hoursWithoutTimer += timesheet.hours_without_timer;
                            roundedHours += timesheet.rounded_hours;
                        });

                        const reportedTimeObj = {
                            hours,
                            hours_without_timer: hoursWithoutTimer,
                            rounded_hours: roundedHours,
                            earliest_time: earliestTime,
                            latest_time: latestTime,
                        }
                        logger.log('harvest-controller.fetchTaskTimeReportedEntries - Check project/task assignments exist on board with subscriptions', null, 'info', { reportedTimeObj, projectTaskAssignments });
                        projectTaskAssignments.forEach(async (projectTaskAssignment) => {
                            logger.log('harvest-controller.fetchTaskTimeReportedEntries - Pocessing project task assignment '+projectTaskAssignment.id, null, 'info', { projectTaskAssignment, reportedTimeObj });
                            // logger.log(subscriptions);
                            subscriptions.filter(subscription => subscription.context && (parseInt(JSON.parse(subscription.context).boardId, 10) === parseInt(projectTaskAssignment?.boardId, 10) || parseInt(JSON.parse(subscription.context).subboardId?.value, 10) === parseInt(projectTaskAssignment.boardId, 10))).forEach(async (subscription) => {
                                logger.log('harvest-controller.fetchTaskTimeReportedEntries - Processing subscription '+subscription.subscriptionsId, null, 'info', { subscription, reportedTimeObj, projectTaskAssignment })

                                const payload = {
                                    trigger: {
                                        outputFields: {
                                            taskId,
                                            projectId,
                                            reportedTime: reportedTimeObj,
                                            boardId: projectTaskAssignment.boardId,
                                            itemId: projectTaskAssignment.itemId,
                                            subItemId: projectTaskAssignment.itemId,
                                            subBoardId: projectTaskAssignment.boardId,
                                        }
                                    }
                                }

                                let success = false;
                                let count = 0;
                                let exception = null;
                                do {
                                    if (count > 2) {
                                        logger.log("harvest-controller.fetchTaskTimeReportedEntries - An error has occured sending the trigger to monday.com: " + exception.message, null, 'error', {
                                            data: exception.response.data,
                                            body: exception.response.body,
                                            status: exception.response.status,
                                            payload,
                                        });
                                        break;
                                    }
                                    count ++;
                                    try {
                                        let { data } = await axios.post(subscription.webhookUrl, payload, { headers: { 'Authorization': process.env.MONDAY_SIGNING_SECRET } });
                                        success = true;
                                        logger.log("harvest-controller.fetchTaskTimeReportedEntries - subscription "+subscription.subscriptionsId + " triggered - result: "+data.success + ' for event: ' + subscription.webhookEvent, null, 'info', { payload, fields: payload.trigger.outputFields });
                                    } catch (err) {
                                        if (axios.isAxiosError(err) && err.response) {
                                            if (err.response.status !== 503) {
                                                logger.log("harvest-controller.fetchTaskTimeReportedEntries - An error has occured sending the trigger to monday.com: " + err.message, null, 'error', {
                                                    data: err.response.data,
                                                    body: err.response.body,
                                                    status: err.response.status,
                                                    payload,
                                                });
                                            }
                                        } else {
                                            logger.log("harvest-controller.fetchTaskTimeReportedEntries - An unknown error has occured: " + err.message, null, 'error', {
                                                payload,
                                                message: err.message,
                                                error: err,
                                            });
                                        }
                                    }
                                } while (!success);
                            });
                        });
                    });
                } catch (err) {
                    logger.log('harvest-controller.fetchTaskTimeReportedEntries - An error has occured fetching task time reported entries: ' + err.message, null, 'error', { name: err.name, message: err.message, stack: err.stack, updatedSinceTime });
                }
            }
        }
    } catch (err) {
        logger.error('harvest-controller.fetchTaskTimeReportedEntries - An error has occured fetching task time reported entries: ' + err.message, null, err);
    }
}

const fetchUpdatedExpenses = async () => {
    try {
        logger.log('harvest-controller.fetchUpdatedExpenses - Fetching updated expenses subscriptions', null, 'info')
        
        const updatedSinceTime = DateTime.now().minus({minutes: 60}).toUTC().toISO();
        const updatedExpenseSubscriptions = await database.findExpenseUpdatedSubscriptions();

        const userIds = [];
        updatedExpenseSubscriptions.forEach(subscription => {
            if (!userIds[subscription.usersId]) {
                userIds[subscription.usersId] = [subscription];
            } else {
                userIds[subscription.usersId].push(subscription);
            }
        });

        logger.log('harvest-controller.fetchUpdatedExpenses - Process user subscriptions', null, 'info')

        // loop through each userIds
        for (const userId in userIds) {
            if (userIds.hasOwnProperty(userId)) {
                const subscriptions = userIds[userId];
                const harvestAccessToken = subscriptions[0].harvestAccessToken;
                
                let nextPage = null;
                let expenses = [];
                try {

                    do {
                        const pagedExpenses = await harvest.getExpenses(harvestAccessToken, nextPage, `updated_since=${updatedSinceTime}`);
                        if (pagedExpenses.expenses.length > 0) {
                            expenses = expenses.concat(pagedExpenses.expenses);
                        }

                        if (pagedExpenses.next_page) {
                            nextPage = pagedExpenses.next_page;
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } else {
                            nextPage = null;
                        }
                    } while (nextPage);
                } catch (err) {
                    console.log(err);
                    logger.log('harvest-controller.fetchUpdatedExpenses - An error has occured fetching expenses: ' + err.message, null, 'error', { updatedSinceTime });
                    return;
                }

                logger.log('harvest-controller.fetchUpdatedExpenses - Process expenses', null, 'info')
                expenses.forEach(async (expense) => {
                    const expenseObj = { ...expense };
                    delete expenseObj.user;
                    delete expenseObj.client;
                    delete expenseObj.project;
                    delete expenseObj.expense_category;
                    delete expenseObj.user_assignment;

                    expenseObj.client = expense.client?.name;
                    expenseObj.project = expense.project?.name;
                    expenseObj.project_code = expense.project?.code;
                    expenseObj.task = expense.task?.name;
                    expenseObj.user_name = expense.user?.name;
                    expenseObj.category = expense.expense_category?.name;
                    expenseObj.invoice_number = expense.invoice?.number;

                    if (expense.user.id) {
                        try {
                            const harvestUser = await harvest.getUser(harvestAccessToken, expense.user.id);
                            expenseObj.user_emails = { identifierType: "email", identifierValue: [harvestUser.email] };
                        } catch (err) {
                            logger.log('harvest-controller.fetchUpdatedTimeEntries - Error fetching user from Harvest: ' + err.message, null, 'error', {
                                error: err,
                                expense,
                            });
                        }
                    }

                    const payload = {
                        trigger: {
                            outputFields: {
                                expense: expenseObj,
                            }
                        }
                    }


                    subscriptions.forEach(async (subscription) => {

                        if (subscription.webhookEvent !== 'EXPENSE_UPDATED') {
                            // Subscription is not for time entry updated
                            return;
                        }

                        let success = false;
                        let count = 0;
                        let exception = null;
                        do {
                            if (count > 2) {
                                logger.log("harvest-controller.fetchUpdatedExpenses - An error has occured sending the trigger to monday.com: " + exception.message, null, 'error', {
                                    data: exception.response.data,
                                    body: exception.response.body,
                                    status: exception.response.status,
                                    payload,
                                });
                                break;
                            }
                            count ++;
                            try {
                                let { data } = await axios.post(subscription.webhookUrl, payload, { headers: { 'Authorization': process.env.MONDAY_SIGNING_SECRET } });
                                success = true;
                                logger.log("harvest-controller.fetchUpdatedExpenses - subscription "+subscription.subscriptionsId + " triggered - result: "+data.success + ' for event: ' + subscription.webhookEvent, null, 'info', { payload, fields: payload.trigger.outputFields });
                            } catch (err) {
                                if (axios.isAxiosError(err) && err.response) {
                                    if (err.response.status !== 503) {
                                        logger.log("harvest-controller.fetchUpdatedExpenses - An error has occured sending the trigger to monday.com: " + err.message, null, 'error', {
                                            data: err.response.data,
                                            body: err.response.body,
                                            status: err.response.status,
                                            payload,
                                        });
                                    }
                                } else {
                                    logger.log("harvest-controller.fetchUpdatedExpenses - An unknown error has occured: " + err.message, null, 'error', {
                                        payload,
                                        message: err.message,
                                        error: err,
                                    });
                                }
                            }
                        } while (!success);
                    });
                });
            }
        }
    } catch (err) {
        logger.error('harvest-controller.fetchUpdatedExpenses - An error has occured fetching updated expenses: ' + err.message, null, err);
    }
}

module.exports = {
    fetchUpdatedTimeEntries,
    fetchTaskTimeReportedEntries,
    fetchUpdatedExpenses,
};