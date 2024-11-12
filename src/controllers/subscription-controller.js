const { LogService } = require('@jacktaylorgroup/upstream-logging');

const database = require('../services/database');

const logger = new LogService();

const subscribeTimesheetUpdates = async (req, res) => {
    const { accountId, userId, user } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues, webhookUrl, subscriptionId, recipeId, integrationId } = payload;

    try {
        logger.log(`subscription-controller.subscribeTimesheetUpdates - Subscribe to timesheet updates`, req, 'info', { userId, accountId, payload })

        let subscription = await database.createMondaySubscription({userId, accountId, webhookUrl, subscriptionId, recipeId, integrationId, context: JSON.stringify(inboundFieldValues), webhookEvent: "TIME_ENTRY_UPDATED" })
        logger.log("subscription-controller.subscribeTimesheetUpdates - Subscription "+subscription.id + " created", req, 'info', { userId, accountId, payload })
        return res.status(200).send({webhookId: subscription.id})

    } catch (err) {
        logger.log("subscription-controller.subscribeTimesheetUpdates - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }

}

const unsubscribeTimesheetUpdates = async (req, res) => {

    const { accountId, userId, shortLivedToken, user } = req.session;
    const { payload } = req.body;
    const { webhookId } = payload;

    try {
        logger.log(`subscription-controller.unsubscribeTimesheetUpdates - Subscribe to timesheet updates`, req, 'info', { userId, accountId, payload })
        await database.deleteMondaySubscriptionById(webhookId)
        logger.log("subscription-controller.unsubscribeTimesheetUpdates - Subscription removed", req, 'info', { userId, accountId, payload })
        return res.status(200).send()
    } catch (err) {
        logger.log("subscription-controller.unsubscribeTimesheetUpdates - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }
}

const subscribeTimesheetUpdatesProjectBoard = async (req, res) => {
    const { accountId, userId, user } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues, webhookUrl, subscriptionId, recipeId, integrationId } = payload;

    try {
        logger.log(`subscription-controller.subscribeTimesheetUpdatesProjectBoard - Subscribe to timesheet updates`, req, 'info', { userId, accountId, payload })

        let subscription = await database.createMondaySubscription({userId, accountId, webhookUrl, subscriptionId, recipeId, integrationId, context: JSON.stringify(inboundFieldValues), webhookEvent: "TIME_ENTRY_UPDATED_PROJECT_BOARD" })
        logger.log("subscription-controller.subscribeTimesheetUpdatesProjectBoard - Subscription "+subscription.id + " created", req, 'info', { userId, accountId, payload })
        return res.status(200).send({webhookId: subscription.id})

    } catch (err) {
        logger.log("subscription-controller.subscribeTimesheetUpdates - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }

}

const unsubscribeTimesheetUpdatesProjectBoard = async (req, res) => {

    const { accountId, userId, shortLivedToken, user } = req.session;
    const { payload } = req.body;
    const { webhookId } = payload;

    try {
        logger.log(`subscription-controller.unsubscribeTimesheetUpdatesProjectBoard - Subscribe to timesheet updates`, req, 'info', { userId, accountId, payload })
        await database.deleteMondaySubscriptionById(webhookId)
        logger.log("subscription-controller.unsubscribeTimesheetUpdatesProjectBoard - Subscription removed", req, 'info', { userId, accountId, payload })
        return res.status(200).send()
    } catch (err) {
        logger.log("subscription-controller.unsubscribeTimesheetUpdatesProjectBoard - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }
}

const subscribeTaskTimeReportedUpdated = async (req, res) => {
    const { accountId, userId, user } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues, webhookUrl, subscriptionId, recipeId, integrationId } = payload;

    try {
        logger.log(`subscription-controller.subscribeTaskTimeReportedUpdated - Subscribe to task time entry updated`, req, 'info', { userId, accountId, payload })

        let subscription = await database.createMondaySubscription({userId, accountId, webhookUrl, subscriptionId, recipeId, integrationId, context: JSON.stringify(inboundFieldValues), webhookEvent: "TASK_TIME_REPORTED_UPDATED" })
        logger.log("subscription-controller.subscribeTaskTimeReportedUpdated - Subscription "+subscription.id + " created", req, 'info', { userId, accountId, payload })
        return res.status(200).send({webhookId: subscription.id})

    } catch (err) {
        logger.log("subscription-controller.subscribeTaskTimeReportedUpdated - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }

}

const unsubscribeTaskTimeReportedUpdated = async (req, res) => {

    const { accountId, userId, shortLivedToken, user } = req.session;
    const { payload } = req.body;
    const { webhookId } = payload;

    try {
        logger.log(`subscription-controller.unsubscribeTaskTimeReportedUpdateds - Subscribe to timesheet updates`, req, 'info', { userId, accountId, payload })
        await database.deleteMondaySubscriptionById(webhookId)
        logger.log("subscription-controller.unsubscribeTaskTimeReportedUpdated - Subscription removed", req, 'info', { userId, accountId, payload })
        return res.status(200).send()
    } catch (err) {
        logger.log("subscription-controller.unsubscribeTaskTimeReportedUpdated - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }
}

const subscribeTaskTimeReportedUpdatedSubitem = async (req, res) => {
    const { accountId, userId, user } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues, webhookUrl, subscriptionId, recipeId, integrationId } = payload;

    try {
        logger.log(`subscription-controller.subscribeTaskTimeReportedUpdatedSubitem - Subscribe to task time entry updated`, req, 'info', { userId, accountId, payload })

        let subscription = await database.createMondaySubscription({userId, accountId, webhookUrl, subscriptionId, recipeId, integrationId, context: JSON.stringify(inboundFieldValues), webhookEvent: "TASK_TIME_REPORTED_UPDATED_SUBITEM" })
        logger.log("subscription-controller.subscribeTaskTimeReportedUpdatedSubitem - Subscription "+subscription.id + " created", req, 'info', { userId, accountId, payload })
        return res.status(200).send({webhookId: subscription.id})

    } catch (err) {
        logger.log("subscription-controller.subscribeTaskTimeReportedUpdatedSubitem - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }

}

const unsubscribeTaskTimeReportedUpdatedSubitem = async (req, res) => {

    const { accountId, userId, shortLivedToken, user } = req.session;
    const { payload } = req.body;
    const { webhookId } = payload;

    try {
        logger.log(`subscription-controller.unsubscribeTaskTimeReportedUpdatedSubitem - Subscribe to timesheet updates`, req, 'info', { userId, accountId, payload })
        await database.deleteMondaySubscriptionById(webhookId)
        logger.log("subscription-controller.unsubscribeTaskTimeReportedUpdatedSubitem - Subscription removed", req, 'info', { userId, accountId, payload })
        return res.status(200).send()
    } catch (err) {
        logger.log("subscription-controller.unsubscribeTaskTimeReportedUpdatedSubitem - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }
}

const subscribeExpensesUpdated = async (req, res) => {
    const { accountId, userId, user } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues, webhookUrl, subscriptionId, recipeId, integrationId } = payload;

    try {
        logger.log(`subscription-controller.subscribeExpensesUpdated - Subscribe to expense updates.`, req, 'info', { userId, accountId, payload })

        let subscription = await database.createMondaySubscription({userId, accountId, webhookUrl, subscriptionId, recipeId, integrationId, context: JSON.stringify(inboundFieldValues), webhookEvent: "EXPENSE_UPDATED" })
        logger.log("subscription-controller.subscribeExpensesUpdated - Subscription "+subscription.id + " created", req, 'info', { userId, accountId, payload })
        return res.status(200).send({webhookId: subscription.id})

    } catch (err) {
        logger.log("subscription-controller.subscribeExpensesUpdated - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }

}

const unsubscribeExpensesUpdated = async (req, res) => {

    const { accountId, userId, shortLivedToken, user } = req.session;
    const { payload } = req.body;
    const { webhookId } = payload;

    try {
        logger.log(`subscription-controller.unsubscribeExpensesUpdated - Unsubscribe to expense updates.`, req, 'info', { userId, accountId, payload })
        await database.deleteMondaySubscriptionById(webhookId)
        logger.log("subscription-controller.unsubscribeExpensesUpdated - Subscription removed", req, 'info', { userId, accountId, payload })
        return res.status(200).send()
    } catch (err) {
        logger.log("subscription-controller.unsubscribeExpensesUpdated - An unknown error has occured: " + err.message, req, 'error', { userId, accountId, payload, error: err });
        return res.status(400).send({ message: "an error has occured" })
    }
}

module.exports = {
    subscribeTimesheetUpdates, unsubscribeTimesheetUpdates,
    subscribeTimesheetUpdatesProjectBoard, unsubscribeTimesheetUpdatesProjectBoard,
    subscribeTaskTimeReportedUpdated, unsubscribeTaskTimeReportedUpdated,
    subscribeTaskTimeReportedUpdatedSubitem, unsubscribeTaskTimeReportedUpdatedSubitem,
    subscribeExpensesUpdated, unsubscribeExpensesUpdated
};