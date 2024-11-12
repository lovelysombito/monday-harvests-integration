const { LogService } = require('@jacktaylorgroup/upstream-logging');

const axios = require('axios');

const logger = new LogService();
const HARVEST_APIURL = `https://api.harvestapp.com/v2`


const createClient = async (key, payload) => {
    logger.log("harvest-service.createClient", null, 'info', { payload })

    try {
        let { data } = await axios.post(HARVEST_APIURL + "/clients", payload, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.createClient - Response:/clients: 201", null, 'info', { payload, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.createClient - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.createClient - An error has occoured on the response", null, err );
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.createClient - An unknown error has occured", null, err );
            throw new Error(err.message);
        }
    }
}

const updateClient = async (key, clientId, payload) => {
    logger.log("harvest-service.updateClient",  null, 'info', { payload })

    try {
        let { data } = await axios.patch(HARVEST_APIURL + `/clients/${clientId}`, payload, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.updateClient - Response:/clients: 200", null, 'info', { payload, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.updateClient - An error has occoured on the request", null, err );
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.updateClient - An error has occoured on the response", null, err );
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.updateClient - An unknown error has occured", null, err );
            throw new Error(err.message);
        }
    }
}

const getClients = async (key, nextPage) => {
    try {
        let url = nextPage ? nextPage : HARVEST_APIURL + "/clients";
        let { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.getClients - Response:/clients: 200", null, 'info', { nextPage, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.getClients - An error has occoured on the request", null, err );
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.getClients - An error has occoured on the response", null, err );
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.getClients - An unknown error has occured", null, err );
            throw new Error(err.message);
        }
    }
}

const createProject = async(key, payload) => {
    try {
        let { data } = await axios.post(HARVEST_APIURL + "/projects", payload, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.createProject - Response:/projects: 201", null, 'info', { payload, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.createProject - An error has occoured on the request", null, err );
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.createProject - An error has occoured on the response", null, err );
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.createProject - An unknown error has occured", null, err );
            throw new Error(err.message);
        }
    }
}

const updateProject = async(key, projectId, payload) => {
    try {
        let { data } = await axios.patch(HARVEST_APIURL + `/projects/${projectId}`, payload, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.updateProject - Response:/projects: 200", null, 'info', { payload, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.updateProject - An error has occoured on the request", null, err );
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.updateProject - An error has occoured on the response", null, err );
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.updateProject - An unknown error has occured", null, err );
            throw new Error(err.message);
        }
    }
}

const getProjects = async(key, nextPage, query) => {
    try {
        let url = nextPage ? nextPage : `${HARVEST_APIURL}/projects?${query}`;
        let { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.getProjects - Response:/projects: 200", null, 'info', { nextPage, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.getProjects - An error has occoured on the request", null, err );
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.getProjects - An error has occoured on the response", null, err );
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.getProjects - An unknown error has occured", null, err );
            throw new Error(err.message);
        }
    }
}

const getUsers = async(key, nextPage) => {
    try {
        let url = nextPage ? nextPage : HARVEST_APIURL + "/users";
        let { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.getUsers - Response:/users: 200", null, 'info', { nextPage, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.getUsers - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.getUsers - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.getUsers - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const getUser = async(key, userId) => {
    try {
        let url = HARVEST_APIURL + "/users/" + userId;
        let { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.getUsers - Response:/users/{id}: 200", null, 'info', {  data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.getUsers - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.getUsers - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.getUsers - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const assignUserToProject = async(key, projectId, userId) => {
    try {
        let { data } = await axios.post(HARVEST_APIURL + `/projects/${projectId}/user_assignments`, {user_id: userId}, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.assignUserToProject - Response:/user_assignments: 201", null, 'info', { projectId, userId, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.assignUserToProject - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.assignUserToProject - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.assignUserToProject - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const removeUserFromProject = async(key, projectId, userAssignmentId) => {
    try {
        let { data } = await axios.delete(HARVEST_APIURL + `/projects/${projectId}/user_assignments/${userAssignmentId}`, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.removeUserFromProject - Response:/projects: 200", null, 'info', { projectId, userAssignmentId, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.removeUserFromProject - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.removeUserFromProject - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.removeUserFromProject - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const createTask = async(key, payload) => {
    try {
        let { data } = await axios.post(HARVEST_APIURL + "/tasks", payload, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.createTask - Response:/tasks: 201", null, 'info', { payload, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.createTask - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.createTask - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.createTask - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const updateTask = async(key, taskId, payload) => {
    try {
        let { data } = await axios.patch(HARVEST_APIURL + `/tasks/${taskId}`, payload, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.updateTask - Response:/tasks: 200", null, 'info', { payload, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.updateTask - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.updateTask - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.updateTask - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const assignTaskToProject = async(key, projectId, taskId, options = {}) => {
    try {
        let { data } = await axios.post(HARVEST_APIURL + `/projects/${projectId}/task_assignments`, {task_id: taskId, ...options}, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.assignTaskToProject - Response:/task_assignments: 201", null, 'info', { projectId, taskId, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.assignTaskToProject - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.assignTaskToProject - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.assignTaskToProject - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const updateTaskAssignment = async(key, projectId, taskAssignmentId, options = {}) => {
    try {
        let { data } = await axios.patch(HARVEST_APIURL + `/projects/${projectId}/task_assignments/${taskAssignmentId}`, options, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log(`harvest-service.updateTaskAssignment - Response:/ projects/${projectId}/task_assignments/${taskAssignmentId}: 201`, null, 'info', { projectId, taskAssignmentId, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.log("harvest-service.updateTaskAssignment - An error has occoured on the request", null, 'error', { name: err.name, message: err.message, stack: err.stack, projectId, taskAssignmentId, options});
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.updateTaskAssignment - An error has occoured on the response", null, err, { projectId, taskAssignmentId, options});
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.updateTaskAssignment - An unknown error has occured", null, err, { projectId, taskAssignmentId, options});
            throw new Error(err.message);
        }
    }
}

const findTaskAssignment = async(key, projectId, taskId) => {
    try {
        let { data } = await axios.get(HARVEST_APIURL + `/projects/${projectId}/task_assignments`, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.findTaskAssignment - Response:/projects/{id}/task_assignments: 200", null, 'info', { projectId, taskId, data })
        const taskAssignment = data.task_assignments.find(task => task.task.id == taskId);
        return taskAssignment;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.findTaskAssignment - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.findTaskAssignment - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.findTaskAssignment - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const getTasks = async(key, nextPage) => {
    try {
        let url = nextPage ? nextPage : HARVEST_APIURL + "/tasks";
        let { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.getTasks - Response:/tasks: 200", null, 'info', { nextPage, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.getTasks - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.getTasks - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.getTasks - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const getTimeEntries = async(key, nextPage, query) => {
    try {
        let url = nextPage ? nextPage : `${HARVEST_APIURL}/time_entries?${query}`;
        let { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.getTimeEntries - Response:/timeEntries: 200", null, 'info', { nextPage, data, query })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.getTimeEntries - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.getTimeEntries - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.getTimeEntries - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
};

const createExpense = async(key, payload) => {
    try {
        let { data } = await axios.post(HARVEST_APIURL + "/expenses", payload, { headers: { 'Authorization': `Bearer ${key}` } });
        logger.log("harvest-service.createExpense - Response:/expenses: 201", null, 'info', { payload, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.createExpense - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.createExpense - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.createExpense - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
};

const updateExpense = async(key, expenseId, payload) => {
    try {
        let { data } = await axios.patch(HARVEST_APIURL + `/expense/${expenseId}`, payload, { headers: { 'Authorization': `Bearer ${key}` } });
        logger.log("harvest-service.updateExpense - Response:/expense: 200", null, 'info', { payload, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.updateExpense - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.updateExpense - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.updateExpense - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const getExpenseCategories = async(key, nextPage) => {
    try {
        let url = nextPage ? nextPage : HARVEST_APIURL + "/expense_categories";
        let { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.getExpenseCategories - Response:/expense_categories: 200", null, 'info', { nextPage, data })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.getExpenseCategories - An error has occoured on the request", null, err);
            throw new Error(err.response.data.message);
        } else if (err.response) {
            logger.error("harvest-service.getExpenseCategories - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.getExpenseCategories - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
}

const getExpenses = async(key, nextPage, query) => {
    try {
        let url = nextPage ? nextPage : `${HARVEST_APIURL}/expenses?${query}`;
        let { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${key}` } })
        logger.log("harvest-service.getExpenses - Response:/expenses: 200", null, 'info', { nextPage, data, query })
        return data;
    } catch (err) {
        if (err.request) {
            logger.error("harvest-service.getExpenses - An error has occoured on the request", null, err);
            throw new Error(err.response.data.error_description);
        } else if (err.response) {
            logger.error("harvest-service.getExpenses - An error has occoured on the response", null, err);
            throw new Error(err.message);
        } else {
            logger.error("harvest-service.getExpenses - An unknown error has occured", null, err);
            throw new Error(err.message);
        }
    }
};

module.exports = {
    createClient,
    updateClient,
    getClients,
    
    createProject,
    updateProject,
    getProjects,
    
    getUsers,
    getUser,
    assignUserToProject,
    removeUserFromProject,
    
    createTask,
    updateTask,
    assignTaskToProject,
    updateTaskAssignment,
    findTaskAssignment,
    getTasks,

    getTimeEntries,

    createExpense,
    updateExpense,
    getExpenseCategories,
    getExpenses,
}