const { Op, Sequelize, QueryTypes } = require('sequelize');
const { User, ProjectItem, TimesheetItem, ClientItem, ProjectUserAssignment, ProjectTaskAssignment, Task, TaskItem, MondaySubscription, ExpenseItem } = require('../../models');

let sequelize;

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.js')[env];
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const createUser = async (userObj) => {
    let user = await User.create(userObj).then(user => user);
    return user;
};

const updateUser = async (user, userObj) => {
    let updatedUser = await user.update(userObj).then(user => user);
    return updatedUser;
};

const findUser = async (userId, accountId) => {
    const user = await User.findOne({
        where: {
            userId, accountId,
        }
    });
    return user;
};

const findClientItemByItemId = async (accountId, boardId, itemId) => {
    const client = await ClientItem.findOne({
        raw: true,
        attributes: ['id', 'accountId', 'boardId', 'itemId', 'clientId'],
        where: {
            boardId,
            itemId,
            accountId,
        }
    });
    return client;
}

const findHarvestUsers = async(expirationTime) => {
    return User.findAll({
        where: {
            harvestAccessToken: {
                [Op.ne]: null,
            },
            harvestRefreshToken: {
                [Op.ne]: null,
            },
            harvestTokenExpiresAt: {
                [Op.lt]: expirationTime,
            },
        }
    });

}

const createClientToItem = async (clientObj) => {
    let client = await ClientItem.create(clientObj).then(client => client);
    return client;
}

const findProjectItemByItemId = async (accountId, boardId, itemId) => {
    const project = await ProjectItem.findOne({
        attributes: ['id', 'accountId', 'boardId', 'itemId', 'projectId'],
        where: {
            boardId,
            itemId,
            accountId,
        },
        include: [{
            model: ProjectUserAssignment,
            as: 'projectUserAssignments',
        },{
            model: ProjectTaskAssignment,
            as: 'projectTaskAssignments',
            include: [{
                model: TaskItem,
                as: 'taskItem',
                include: 'task'
            }, {
                model: Task,
                as: 'task'
            }]
        }],
    });
    return project;
}

const findProjectItemByItemIdOnly = async (accountId, itemId) => {
    const project = await ProjectItem.findOne({
        attributes: ['id', 'accountId', 'boardId', 'itemId', 'projectId'],
        where: {
            itemId,
            accountId,
        },
        include: [{
            model: ProjectUserAssignment,
            as: 'projectUserAssignments',
        },{
            model: ProjectTaskAssignment,
            as: 'projectTaskAssignments',
            include: [{
                model: TaskItem,
                as: 'taskItem',
                include: 'task'
            }, {
                model: Task,
                as: 'task'
            }]
        }],
    });
    return project;
}

const findProjectItemByProjectId = async (accountId, boardId, projectId) => {
    const project = await ProjectItem.findOne({
        attributes: ['id', 'accountId', 'boardId', 'itemId', 'projectId'],
        where: {
            boardId,
            projectId,
            accountId,
        }
    });
    return project;
}

const findProjectTaskAssignmentByTaskAndProjectId = async (accountId, projectId, taskId) => {
    const taskAssignments = await sequelize.query(`SELECT ProjectTaskAssignments.id, Tasks.taskId, ProjectItems.projectId, ProjectTaskAssignments.boardId, ProjectTaskAssignments.itemId  FROM ProjectItems INNER JOIN ProjectTaskAssignments ON (ProjectItems.id = ProjectTaskAssignments.projectId) INNER JOIN Tasks ON ProjectTaskAssignments.taskId = Tasks.id  WHERE ProjectTaskAssignments.accountId = ${accountId} AND ProjectItems.projectId = ${projectId} AND Tasks.taskId = ${taskId};`, { type: QueryTypes.SELECT });
    return taskAssignments;
}

const createProjectToItem = async (projectObj) => {
    let project = await ProjectItem.create(projectObj).then(project => project);
    return project;
}

const createProjectUserAssignment = async (projectUserAssignmentObj) => {
    let projectUserAssignment = await ProjectUserAssignment.create(projectUserAssignmentObj).then(projectUserAssignment => projectUserAssignment);
    return projectUserAssignment;
}

const removeProjectUserAssignment = async (projectUserAssignment) => {
    await projectUserAssignment.destroy();
}

const createProjectTaskAssignment = async (projectTaskAssignmentObj) => {
    let projectTaskAssignment = await ProjectTaskAssignment.create(projectTaskAssignmentObj).then(projectTaskAssignment => projectTaskAssignment);
    return projectTaskAssignment;
}

const updateProjectTaskAssignment = async (projectTaskAssignment, projectTaskAssignmentObj) => {
    let updatedProjectTaskAssignment = await projectTaskAssignment.update(projectTaskAssignmentObj).then(projectTaskAssignment => projectTaskAssignment);
    return updatedProjectTaskAssignment;
}

const findTasksByAccountId = async (accountId) => {
    const tasks = await Task.findAll({
        where: {
            accountId,
        }
    });
    return tasks;
}

const findTasksOnBoard = async (taskId, accountId, boardIds) => {
    const tasks = await ProjectTaskAssignment.findAll({
        include: [{
            model: Task,
            as: 'task',
            where: {
                taskId,
            }
        }],
        where: {
            accountId,
            boardId: {
                [Op.in]: boardIds
            }
        }
    });
    return tasks;
}

const createTask = async (taskObj) => {
    let task = await Task.create(taskObj).then(task => task);
    return task;
}

const createMondaySubscription = async (subscriptionObj) => {
    let subscription = await MondaySubscription.create(subscriptionObj).then(subscription => subscription);
    return subscription;
}

const deleteMondaySubscriptionById = async (id) => {
    return await MondaySubscription.destroy({
        where: {
            id: id
        }
    });
}

const findTimeEntryUpdatedSubscriptions = async () => {
    const subscriptions = await sequelize.query('SELECT Users.id as usersId, Users.harvestAccessToken, MondaySubscriptions.id as subscriptionsId, MondaySubscriptions.userId, MondaySubscriptions.accountId, MondaySubscriptions.webhookUrl, MondaySubscriptions.subscriptionId, MondaySubscriptions.webhookEvent, MondaySubscriptions.context, MondaySubscriptions.recipeId, MondaySubscriptions.integrationId FROM MondaySubscriptions INNER JOIN Users ON (Users.userId = MondaySubscriptions.userId AND Users.accountId = MondaySubscriptions.accountId) WHERE Users.deletedAt IS NULL AND MondaySubscriptions.deletedAt IS NULL AND (webhookEvent = "TIME_ENTRY_UPDATED" OR webhookEvent = "TIME_ENTRY_UPDATED_PROJECT_BOARD");', { type: QueryTypes.SELECT });
    return subscriptions;
}

const findTaskTimeReportedSubscriptions = async () => {
    const subscriptions = await sequelize.query('SELECT Users.id as usersId, Users.harvestAccessToken, MondaySubscriptions.id as subscriptionsId, MondaySubscriptions.userId, MondaySubscriptions.accountId, MondaySubscriptions.webhookUrl, MondaySubscriptions.subscriptionId, MondaySubscriptions.webhookEvent, MondaySubscriptions.context, MondaySubscriptions.recipeId, MondaySubscriptions.integrationId FROM MondaySubscriptions INNER JOIN Users ON (Users.userId = MondaySubscriptions.userId AND Users.accountId = MondaySubscriptions.accountId) WHERE Users.deletedAt IS NULL AND MondaySubscriptions.deletedAt IS NULL AND (webhookEvent = "TASK_TIME_REPORTED_UPDATED" OR webhookEvent = "TASK_TIME_REPORTED_UPDATED_SUBITEM");', { type: QueryTypes.SELECT });
    return subscriptions;
}


const findTimeEntryByItemId = async (accountId, boardId, itemId) => {
    const timesheet = await TimesheetItem.findOne({
        where: {
            accountId,
            boardId,
            itemId,
        }
    });
    return timesheet;
}

const findTimeEntryById = async (accountId, boardId, timesheetId) => {
    const timesheet = await TimesheetItem.findOne({
        where: {
            accountId,
            boardId,
            timesheetId,
        }
    });
    return timesheet;
}

const createTimesheetItem = async (timesheetObj) => {
    let timesheet = await TimesheetItem.create(timesheetObj).then(timesheet => timesheet);
    return timesheet;
}

const createExpenseItem = async (expenseObj) => {
    let expense = await ExpenseItem.create(expenseObj).then(expense => expense);
    return expense;
}

const findExpenseItemByItemId = async (accountId, boardId, itemId) => {
    const expense = await ExpenseItem.findOne({
        where: {
            accountId,
            boardId,
            itemId,
        }
    });
    return expense;
}

const findExpenseById = async (accountId, boardId, expenseId) => {
    const expense = await ExpenseItem.findOne({
        where: {
            accountId,
            boardId,
            expenseId,
        }
    });
    return expense;
}

const findExpenseUpdatedSubscriptions = async () => {
    const subscriptions = await sequelize.query('SELECT Users.id as usersId, Users.harvestAccessToken, MondaySubscriptions.id as subscriptionsId, MondaySubscriptions.userId, MondaySubscriptions.accountId, MondaySubscriptions.webhookUrl, MondaySubscriptions.subscriptionId, MondaySubscriptions.webhookEvent, MondaySubscriptions.context, MondaySubscriptions.recipeId, MondaySubscriptions.integrationId FROM MondaySubscriptions INNER JOIN Users ON (Users.userId = MondaySubscriptions.userId AND Users.accountId = MondaySubscriptions.accountId) WHERE Users.deletedAt IS NULL AND MondaySubscriptions.deletedAt IS NULL AND (webhookEvent = "EXPENSE_UPDATED");', { type: QueryTypes.SELECT });
    return subscriptions;
}

module.exports = {
    createUser,
    updateUser,
    findUser,
    findHarvestUsers,

    findClientItemByItemId,
    createClientToItem,
    
    findProjectItemByItemId,
    findProjectItemByItemIdOnly,
    findProjectItemByProjectId,
    createProjectToItem,
    
    createProjectUserAssignment,
    removeProjectUserAssignment,
    
    createProjectTaskAssignment,
    findProjectTaskAssignmentByTaskAndProjectId,
    updateProjectTaskAssignment,

    findTasksByAccountId,
    createTask,
    findTasksOnBoard,

    createMondaySubscription,
    deleteMondaySubscriptionById,

    findTimeEntryUpdatedSubscriptions,
    findTaskTimeReportedSubscriptions,
    findTimeEntryByItemId,
    findTimeEntryById,
    createTimesheetItem,

    createExpenseItem,
    findExpenseById,
    findExpenseItemByItemId,
    findExpenseUpdatedSubscriptions,
};