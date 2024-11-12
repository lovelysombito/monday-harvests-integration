const { DateTime } = require('luxon');
const { LogService } = require('@jacktaylorgroup/upstream-logging');

const database = require('../services/database');
const harvest = require('../services/harvest');
const monday = require('../services/monday');

const logger = new LogService();

const createClient = async(req, res) => {
    try {
        const { accountId, userId, shortLivedToken, user } = req.session;
        const { payload } = req.body;
        const { inboundFieldValues } = payload;
        const { clientFields: client, boardId, itemId } = inboundFieldValues;
        logger.log(`action-controller.createClient - Attempt to create a new client.`, req, 'info', { userId, accountId, client, itemId, boardId })

        if (!client.name) {
            logger.log("action-controller.createClient - Client name has not been mapped", req, 'info', { client, remediation: 'Client name is a required field', userId, accountId, boardId, itemId})
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create client",
                "notificationErrorDescription": "Client name has not been mapped or is empty",
                "runtimeErrorDescription": "Client name has not been mapped or is empty",
            });
        }

        logger.log("action-controller.createClient - Search for existing client based on item id", req, 'info', { userId, accountId, payload, itemId, boardId })
        let existingClient = await database.findClientItemByItemId(accountId, boardId, itemId)
        if (existingClient) {
            //we have already synced with item with Harvest, lets update the Client just in case
            logger.log(`action-controller.createClient - Existing item found for client: ${existingClient.id}`, req, 'info', { userId, accountId, payload, itemId, boardId })

            let harvestClient = await harvest.updateClient(user.harvestAccessToken, existingClient.clientId, client)
            logger.log("action-controller.createClient - Successfully updated client", req, 'info', { itemId: itemId, clientId: harvestClient.id, client })
            return res.status(200).send({ message: "Successfully updated client" });
        } else {
            //it is a new item to sync, lets search for a Client with an existing name, otherwise we will create a new client'
            logger.log("action-controller.createClient - No existing item id found", req, 'info', { itemId, userId, accountId, boardId, client })

            let foundExistingClient = false;
            let nextPage = null;
            let existingClients = [];
            do {
                existingClients = await harvest.getClients(user.harvestAccessToken, nextPage)
                if (existingClients.clients.length > 0) {
                    for (let i=0;i<existingClients.clients.length;i++) {
                        if (existingClients.clients[i].name.toLowerCase() === client.name.toLowerCase()) {
                            foundExistingClient = true;
                            existingClient = existingClients.clients[i];
                            break;
                        }
                    }
                }
                if (existingClients.next_page) {
                    nextPage = existingClients.next_page;
                }
            } while (nextPage && !foundExistingClient)
            
            if (existingClient) {
                //we have found an existing harvest client with the same name, Harvest only allows unique client names, so lets sync this one up
                logger.log(`action-controller.createClient - Harvest client found with matching name`, req, 'info', { itemId, client, userId, accountId, boardId, existingClient })
                let newClient = await database.createClientToItem({
                    accountId,
                    boardId,
                    itemId,
                    clientId: existingClient.id,
                });

                logger.log("action-controller.createClient - Successfully stored client", req, 'info', { itemId, client, userId, accountId, boardId, existingClient })
                return res.status(200).send({ message: "Successfully synced client" });
            } else {
                //No client has been found with the same name, so lets create a new client
                logger.log("action-controller.createClient - No Harvest client found with matching name", req, 'info', { itemId, client, userId, accountId, boardId })

                let harvestClient = await harvest.createClient(user.harvestAccessToken, client)

                let newClient = await database.createClientToItem({
                    accountId,
                    boardId,
                    itemId,
                    clientId: harvestClient.id,
                });

                logger.log("action-controller.createClient - Successfully created a new client", req, 'info', {itemId, client, userId, accountId, boardId, clientId: harvestClient.id })
                return res.status(200).send({ message: "Successfully created a new client" });
            }
        }
    } catch (err) {
        logger.error("action-controller.createClient - An unknown error has occured: " + err.message, req, err);
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const createProjectConnectedClient = async(req, res) => {
    try {

        const { accountId, userId, shortLivedToken, user } = req.session;
        const { payload } = req.body;
        const { inboundFieldValues } = payload;
        const { project, boardId, itemId, clientColumnId } = inboundFieldValues;

        logger.log(`action-controller.createProjectConnectedClient - Attempt to create a new project`, req, 'info', { userId, accountId, project, itemId, boardId, clientColumnId })

        let clientId = null;

        if (clientColumnId) {
            //if the client is mapped, we need to search for the client ID

            let { error, response, max_complexity_exceeded } = await monday.queryItemColumnValues(shortLivedToken, itemId, clientColumnId);
            if (error) {
                //Send monday.com notification
                console.error("action-controller.createProjectConnectedClient - error retrieving connected column information", { error: error, itemId, userId, accountId, project, clientColumnId, boardId });
                
                if (max_complexity_exceeded) {
                    console.error("action-controller.createProjectConnectedClient - complexity limit reached", { error: error, itemId, userId, accountId, project, clientColumnId, boardId });
                    logger.log("action-controller.createProjectConnectedClient - complexity limit reached", req, 'error', {error: { name: "maxComplexityExceeded", message: error.message }, itemId, userId, accountId, project, clientColumnId, boardId });
    
                    return res.status(429).send({
                        message: "complexity limit reached"
                    });
                }
                
                logger.log("action-controller.createProjectConnectedClient - error retrieving connected column information", req, 'error', {error: { name: error.name, message: error.message, stack: error.stack }, itemId, userId, accountId, project, clientColumnId, boardId });
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to create project",
                    "notificationErrorDescription": "An error occured retrieving client from connected board column",
                    "runtimeErrorDescription": "An error occured retrieving client from connected board column",
                });
            }

            let connectedItem = null;
            try {
                connectedItem = response.data.items[0].column_values[0].linked_items[0];
            } catch (err) {
                logger.log("action-controller.createProjectConnectedClient - No connected items found to link client", req, 'info', { remediation: 'Client name is a required field', userId, accountId, boardId, itemId, clientColumnId })
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to create project",
                    "notificationErrorDescription": "Client name has not been mapped or is empty in the connected item",
                    "runtimeErrorDescription": "Client name has not been mapped or is empty in the connected item",
                });
            }

            let existingClient = await database.findClientItemByItemId(accountId, boardId, connectedItem.id);
            // Search first for the matching item id, if not, search for the client name
            if (existingClient) {
                clientId = existingClient.clientId;
                logger.log("action-controller.createProjectConnectedClient - Harvest client from matching item id", req, 'info', { itemId, userId, accountId, boardId, clientId })
            } else {
                let clientName = connectedItem.name
                logger.log("action-controller.createProjectConnectedClient - No existing item id found", req, 'info', { itemId, userId, accountId, boardId, clientColumnId, clientName })

                if (!clientName) {
                    logger.log("action-controller.createProjectConnectedClient - Client name has not been mapped", req, 'info', { clientName, remediation: 'Client name is a required field', userId, accountId, boardId, itemId, clientColumnId })
                    return res.status(400).send({
                        "severityCode" : 4000,
                        "notificationErrorTitle": "Unable to create project",
                        "notificationErrorDescription": "Client name has not been mapped or is empty in the connected item",
                        "runtimeErrorDescription": "Client name has not been mapped or is empty in the connected item",
                    });
                }

                let foundExistingClient = false;
                let nextPage = null;
                let existingClients = [];
                do {
                    existingClients = await harvest.getClients(user.harvestAccessToken, nextPage)
                    if (existingClients.clients.length > 0) {
                        for (let i=0;i<existingClients.clients.length;i++) {
                            if (existingClients.clients[i].name.toLowerCase() === clientName.toLowerCase()) {
                                foundExistingClient = true;
                                existingClient = existingClients.clients[i];
                                clientId = existingClient.id;
                                break;
                            }
                        }
                    }
                    if (existingClients.next_page) {
                        nextPage = existingClients.next_page;
                    }
                } while (nextPage && !foundExistingClient)
                
                if (existingClient) {
                    //we have found an existing harvest client with the same name, Harvest only allows unique client names, so lets sync this one up
                    logger.log(`action-controller.createProjectConnectedClient - Harvest client found with matching name`, req, 'info', { itemId, userId, accountId, boardId, existingClient })
                    let newClient = await database.createClientToItem({
                        accountId,
                        boardId,
                        itemId,
                        clientId: existingClient.id,
                    });

                    clientId = existingClient.id;
                    logger.log("action-controller.createProjectConnectedClient - Successfully stored client", req, 'info', { itemId, userId, accountId, boardId, existingClient })
                } else {
                    //No client has been found with the same name, so lets create a new client
                    logger.log("action-controller.createProjectConnectedClient - No Harvest client found with matching name", req, 'info', { itemId, userId, accountId, boardId })

                    let harvestClient = await harvest.createClient(user.harvestAccessToken, { name: clientName })
                    clientId = harvestClient.id;

                    await database.createClientToItem({
                        accountId,
                        boardId,
                        itemId,
                        clientId: harvestClient.id,
                    });

                    logger.log("action-controller.createProjectConnectedClient - Successfully created a new client", req, 'info',{ itemId, userId, accountId, boardId, clientId: harvestClient.id })
                }
            }
        } else {
            logger.log("action-controller.createProjectConnectedClient - No client column has been mapped", req, 'info', { itemId, userId, accountId, boardId, clientColumnId })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create project",
                "notificationErrorDescription": "Client column has not been mapped or is empty",
                "runtimeErrorDescription": "Client column has not been mapped or is empty",
            });
        }

        project.client_id = clientId;
        return await createProject(req, res, project);
    } catch (err) {
        logger.error("action-controller.createProjectConnectedClient - An unknown error has occured: " + err.message, req, err);
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const createProjectConnectedClientSubitemTasks = async(req, res) => {
    try {

        const { accountId, userId, shortLivedToken, user } = req.session;
        const { payload } = req.body;
        const { inboundFieldValues } = payload;
        const { project, boardId, itemId, clientColumnId } = inboundFieldValues;

        logger.log(`action-controller.createProjectConnectedClientSubitemTasks - Attempt to create a new project`, req, 'info', { userId, accountId, project, itemId, boardId, clientColumnId })

        let clientId = null;

        let { error, response, max_complexity_exceeded } = await monday.queryItemColumnValues(shortLivedToken, itemId, clientColumnId);
        if (error) {
            //Send monday.com notification
            console.error("action-controller.createProjectConnectedClientSubitemTasks - error retrieving item information", { error: error, itemId, userId, accountId, project, clientColumnId, boardId });
           
            if (max_complexity_exceeded) {
                console.error("action-controller.createProjectConnectedClientSubitemTasks - complexity limit reached", { error: error, itemId, userId, accountId, project, clientColumnId, boardId });
                logger.info("action-controller.createProjectConnectedClientSubitemTasks - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message }, itemId, userId, accountId, project, clientColumnId, boardId });
    
                return res.status(429).send({
                    message: "complexity limit reached"
                });
            }

            logger.info("action-controller.createProjectConnectedClientSubitemTasks - error retrieving item information", req, 'error', { error: { name: error.name, message: error.message, stack: error.stack }, itemId, userId, accountId, project, clientColumnId, boardId });
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create project",
                "notificationErrorDescription": "An error occured retrieving item information",
                "runtimeErrorDescription": "An error occured retrieving item information",
            });
        }



        if (clientColumnId) {
            //if the client is mapped, we need to search for the client ID

            let connectedItem = null;
            try {
                connectedItem = response.data.items[0].column_values[0].linked_items[0];
            } catch (err) {
                logger.log("action-controller.createProjectConnectedClientSubitemTasks - No connected items found to link client", req, 'info', { remediation: 'Client name is a required field', userId, accountId, boardId, itemId, clientColumnId })
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to create project",
                    "notificationErrorDescription": "Client name has not been mapped or is empty in the connected item",
                    "runtimeErrorDescription": "Client name has not been mapped or is empty in the connected item",
                });
            }

            let existingClient = await database.findClientItemByItemId(accountId, boardId, connectedItem.id);
            // Search first for the matching item id, if not, search for the client name
            if (existingClient) {
                clientId = existingClient.clientId;
                logger.log("action-controller.createProjectConnectedClientSubitemTasks - Harvest client from matching item id", req, 'info', { itemId, userId, accountId, boardId, clientId })
            } else {
                let clientName = connectedItem.name
                logger.log("action-controller.createProjectConnectedClientSubitemTasks - No existing item id found", req, 'info', { itemId, userId, accountId, boardId, clientColumnId, clientName })

                if (!clientName) {
                    logger.log("action-controller.createProjectConnectedClientSubitemTasks - Client name has not been mapped", req, 'info', { clientName, remediation: 'Client name is a required field', userId, accountId, boardId, itemId, clientColumnId })
                    return res.status(400).send({
                        "severityCode" : 4000,
                        "notificationErrorTitle": "Unable to create project",
                        "notificationErrorDescription": "Client name has not been mapped or is empty in the connected item",
                        "runtimeErrorDescription": "Client name has not been mapped or is empty in the connected item",
                    });
                }

                let foundExistingClient = false;
                let nextPage = null;
                let existingClients = [];
                do {
                    existingClients = await harvest.getClients(user.harvestAccessToken, nextPage)
                    if (existingClients.clients.length > 0) {
                        for (let i=0;i<existingClients.clients.length;i++) {
                            if (existingClients.clients[i].name.toLowerCase() === clientName.toLowerCase()) {
                                foundExistingClient = true;
                                existingClient = existingClients.clients[i];
                                clientId = existingClient.id;
                                break;
                            }
                        }
                    }
                    if (existingClients.next_page) {
                        nextPage = existingClients.next_page;
                    }
                } while (nextPage && !foundExistingClient)
                
                if (existingClient) {
                    //we have found an existing harvest client with the same name, Harvest only allows unique client names, so lets sync this one up
                    logger.log(`action-controller.createProjectConnectedClientSubitemTasks - Harvest client found with matching name`, req, 'info', { itemId, userId, accountId, boardId, existingClient })
                    let newClient = await database.createClientToItem({
                        accountId,
                        boardId,
                        itemId,
                        clientId: existingClient.id,
                    });

                    clientId = existingClient.id;
                    logger.log("action-controller.createProjectConnectedClientSubitemTasks - Successfully stored client", req, 'info', { itemId, userId, accountId, boardId, existingClient })
                } else {
                    //No client has been found with the same name, so lets create a new client
                    logger.log("action-controller.createProjectConnectedClientSubitemTasks - No Harvest client found with matching name", req, 'info', { itemId, userId, accountId, boardId })

                    let harvestClient = await harvest.createClient(user.harvestAccessToken, { name: clientName })
                    clientId = harvestClient.id;

                    await database.createClientToItem({
                        accountId,
                        boardId,
                        itemId,
                        clientId: harvestClient.id,
                    });

                    logger.log("action-controller.createProjectConnectedClientSubitemTasks - Successfully created a new client", req, 'info', { itemId, userId, accountId, boardId, clientId: harvestClient.id })
                }
            }
        } else {
            logger.log("action-controller.createProjectConnectedClientSubitemTasks - No client column has been mapped", req, 'info', { itemId, userId, accountId, boardId, clientColumnId })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create project",
                "notificationErrorDescription": "Client column has not been mapped or is empty",
                "runtimeErrorDescription": "Client column has not been mapped or is empty",
            });
        }

        project.client_id = clientId;
        project.tasks = [];

        if (response.data.items[0].subitems) {
            for (let i=0;i<response.data.items[0].subitems.length;i++) {
                let subitem = response.data.items[0].subitems[i];
                project.tasks.push({
                    name: subitem.name,
                    itemId: subitem.id,
                    boardId: subitem.board.id,
                });
            }
        }

        

        return await createProject(req, res, project);
    } catch (err) {
        logger.error("action-controller.createProjectConnectedClientSubitemTasks - An unknown error has occured: " + err.message, req, err);
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const createProject = async(req, res, project) => {
    const { accountId, userId, shortLivedToken, user } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues } = payload;
    const { boardId, itemId} = inboundFieldValues;

    logger.log(`action-controller.createProject`, req, 'info', { userId, accountId, project, itemId, boardId })

    // Check required fields have been set
    if (!project.name) {
        logger.log("action-controller.createProject - Project name has not been mapped", req, 'info', { project, remediation: 'Project name is a required field', userId, accountId, boardId, itemId })
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle": "Unable to create project",
            "notificationErrorDescription": "Project name has not been mapped or is empty",
            "runtimeErrorDescription": "Project name has not been mapped or is empty",
        });
    }

    if (!project.is_billable) {
        project.is_billable = false;
    } else {
        project.is_billable = project.is_billable.toString();
        if (project.is_billable.toLowerCase() === 'yes') {
            project.is_billable = true;
        } else if (project.is_billable.toLowerCase() === 'no') {
            project.is_billable = false;
        } else if (project.is_billable.toLowerCase() === 'false') {
            project.is_billable = false;
        } else if (project.is_billable.toLowerCase() === 'true') {
            project.is_billable = true;
        } else {
            project.is_billable = true;
        }
    }

    if (!project.budget_by) {
        project.budget_by = 'none';
    }
    if (!['hours per project', 'total project fees', 'hours per task', 'fees per task', 'hours per person', 'no budget'].includes(project.budget_by.toLowerCase())) {
        logger.log("action-controller.createProject - Project budget by is not a valid value", req, 'info', { project, remediation: 'Project budget by is not a valid value', userId, accountId, boardId, itemId })
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle": "Unable to create project",
            "notificationErrorDescription": "Project Budget By field is not a valid value, accepted values are Hours Per Project, Total Project Fees, Hours Per Task, Fees Per Task, Hours Per Person, No Budget",
            "runtimeErrorDescription": "Project Budget By field is not a valid value, accepted values are Hours Per Project, Total Project Fees, Hours Per Task, Fees Per Task, Hours Per Person, No Budget",
        });
    }
    switch (project.budget_by.toLowerCase()) {
        case 'hours per project':
            project.budget_by = 'project';
            break;
        case 'total project fees':
            project.budget_by = 'project_cost';
            break;
        case 'hours per task':
            project.budget_by = 'task';
            break;
        case 'fees per task':
            project.budget_by = 'task_fees';
            break;  
        case 'hours per person':   
            project.budget_by = 'person';
            break;
        case 'no budget':
        default:    
            project.budget_by = 'none';
            break;
    }

    if (!project.bill_by) {
        logger.log("action-controller.createProject - Project bill by has not been mapped", req, 'info', { project, remediation: 'Project bill by is a required field', userId, accountId, boardId, itemId })
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle": "Unable to create project",
            "notificationErrorDescription": "Project Bill By field has not been mapped or is empty",
            "runtimeErrorDescription": "Project Bill By field has not been mapped or is empty",
        });
    }
    if (!['project', 'tasks', 'people', 'none'].includes(project.bill_by.toLowerCase())) {
        logger.log("action-controller.createProject - Project bill by is not a valid value", req, 'info', { billBy: project.bill_by.toLowerCase(), project, remediation: 'Project bill by is not a valid value', userId, accountId, boardId, itemId })
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle": "Unable to create project",
            "notificationErrorDescription": "Project Bill By field is not a valid value, accepted values are Project, Tasks, People, None",
            "runtimeErrorDescription": "Project Bill By field is not a valid value, accepted values are Project, Tasks, People, None",
        });
    }

    // Calculate optional fields
    if (project.is_active) {
        project.is_active = project.is_active.toString();
        if (project.is_active.toLowerCase() === 'yes') {
            project.is_active = true;
        } else if (project.is_active.toLowerCase() === 'no') {
            project.is_active = false;
        } else if (project.is_active.toLowerCase() === 'false') {
            project.is_active = false;
        } else if (project.is_active.toLowerCase() === 'true') {
            project.is_active = true;
        } else {
            project.is_active = false;
        }
    }

    if (project.is_fixed_fee) {
        project.is_fixed_fee = project.is_fixed_fee.toString();
        if (project.is_fixed_fee.toLowerCase() === 'yes') {
            project.is_fixed_fee = true;
        } else if (project.is_fixed_fee.toLowerCase() === 'no') {
            project.is_fixed_fee = false;
        } else if (project.is_fixed_fee.toLowerCase() === 'false') {
            project.is_fixed_fee = false;
        } else if (project.is_fixed_fee.toLowerCase() === 'true') {
            project.is_fixed_fee = true;
        } else {
            project.is_fixed_fee = false;
        }
    }

    if (project.budget_is_monthly) {
        project.budget_is_monthly = project.budget_is_monthly.toString();
        if (project.budget_is_monthly.toLowerCase() === 'yes') {
            project.budget_is_monthly = true;
        } else if (project.budget_is_monthly.toLowerCase() === 'no') {
            project.budget_is_monthly = false;
        } else if (project.budget_is_monthly.toLowerCase() === 'false') {
            project.budget_is_monthly = false;
        } else if (project.budget_is_monthly.toLowerCase() === 'true') {
            project.budget_is_monthly = true;
        } else {
            project.budget_is_monthly = false;
        }
    }

    if (project.notify_over_budget) {
        project.notify_over_budget = project.notify_over_budget.toString();
        if (project.notify_over_budget.toLowerCase() === 'yes') {
            project.notify_over_budget = true;
        } else if (project.notify_over_budget.toLowerCase() === 'no') {
            project.notify_over_budget = false;
        } else if (project.notify_over_budget.toLowerCase() === 'false') {
            project.notify_over_budget = false;
        } else if (project.notify_over_budget.toLowerCase() === 'true') {
            project.notify_over_budget = true;
        } else {
            project.notify_over_budget = false;
        }
    }

    if (project.show_budget_to_all) {
        project.show_budget_to_all = project.show_budget_to_all.toString();
        if (project.show_budget_to_all.toLowerCase() === 'yes') {
            project.show_budget_to_all = true;
        } else if (project.show_budget_to_all.toLowerCase() === 'no') {
            project.show_budget_to_all = false;
        } else if (project.show_budget_to_all.toLowerCase() === 'false') {
            project.show_budget_to_all = false;
        } else if (project.show_budget_to_all.toLowerCase() === 'true') {
            project.show_budget_to_all = true;
        } else {
            project.show_budget_to_all = false;
        }
    }

    if (project.cost_budget_include_expenses) {
        project.cost_budget_include_expenses = project.cost_budget_include_expenses.toString();
        if (project.cost_budget_include_expenses.toLowerCase() === 'yes') {
            project.cost_budget_include_expenses = true;
        } else if (project.cost_budget_include_expenses.toLowerCase() === 'no') {
            project.cost_budget_include_expenses = false;
        } else if (project.cost_budget_include_expenses.toLowerCase() === 'false') {
            project.cost_budget_include_expenses = false;
        } else if (project.cost_budget_include_expenses.toLowerCase() === 'true') {
            project.cost_budget_include_expenses = true;
        } else {
            project.cost_budget_include_expenses = false;
        }
    }

    try {

        let existingProject = await database.findProjectItemByItemId(accountId, boardId, itemId);
        if (existingProject && existingProject.id) {
            // //we have already synced with item with Clockify, lets update the Client just in case
            logger.log(`action-controller.createProject - Existing project item found: ${existingProject.id}`, req, 'info', { userId, accountId, project, itemId, boardId, existingProject })
            
            let harvestProject = await harvest.updateProject(user.harvestAccessToken, existingProject.projectId, project);
            logger.log("action-controller.createProject - Successfully updated project", req, 'info', { itemId, projectId: harvestProject.id, project, boardId, userId, accountId })
        } else {
            //it is a new item to sync, lets search for a Client with an existing name, otherwise we will create a new client'
            logger.log("action-controller.createProject - No existing project item found, creating", req, 'info', { itemId, project, boardId, userId, accountId })


            try {
                const harvestProject = await harvest.createProject(user.harvestAccessToken, project)
                await database.createProjectToItem({
                    accountId,
                    boardId,
                    itemId,
                    projectId: harvestProject.id
                });
                existingProject = await database.findProjectItemByItemId(accountId, boardId, itemId);


                logger.log("action-controller.createProject - Successfully created a new project", req, 'info',  { itemId, projectId: harvestProject.id, project, boardId, userId, accountId })
            } catch (err) {
                if (err.message.includes("Name This project name is already used on another project.")) {
                    let nextPage = null;
                    let projectMatched = false;
                    let existingProjectId = null;
                    do {
                        const harvestProjects = await harvest.getProjects(user.harvestAccessToken, nextPage, `clientId=${project.client_id}`);
                        if (harvestProjects.projects.length > 0) {
                            for (let i=0;i<harvestProjects.projects.length;i++) {
                                if (project.name.toLowerCase() === harvestProjects.projects[i].name.toLowerCase()) {
                                    existingProjectId = harvestProjects.projects[i].id;
                                    projectMatched = true;
                                }
                            }
                        }
                        if (harvestProjects.next_page) {
                            nextPage = harvestProjects.next_page;
                        }
                    } while (nextPage && !projectMatched)

                    if (existingProjectId) {
                        let harvestProject = await harvest.updateProject(user.harvestAccessToken, existingProjectId, project);
                        logger.log("action-controller.createProject - Successfully linked and updated project", req, 'info', { itemId, projectId: harvestProject.id, project, boardId, userId, accountId })
                        await database.createProjectToItem({
                            accountId,
                            boardId,
                            itemId,
                            projectId: existingProjectId
                        });
                        existingProject = await database.findProjectItemByItemId(accountId, boardId, itemId);
                        logger.log("action-controller.createProject - Successfully linked existing project", req, 'info', { itemId, projectId: existingProjectId, project, boardId, userId, accountId })
                    }
                } else {
                    throw err;
                }
            }
        }

        if (project.users) {
            // People column, match by email
            let match = 'email';
            let users = [];
            if (project.users.identifierValue) {
                users = project.users.identifierValue;
            } else {
                match = 'name';
                users = project.users;
            }

            const userAssignments = [];
            let nextPage = null;
            let usersMatched = false;
            do {
                const harvestUsers = await harvest.getUsers(user.harvestAccessToken, nextPage);
                if (harvestUsers.users.length > 0) {
                    for (let i=0;i<harvestUsers.users.length;i++) {
                        if (match === 'email') {
                            if (users.includes(harvestUsers.users[i]['email'].toLowerCase())) {
                                userAssignments.push(harvestUsers.users[i].id);
                            }
                        } else {
                            if (users.includes(`${harvestUsers.users[i]['first_name']} ${harvestUsers.users[i]['last_name']}`)) {
                                userAssignments.push(harvestUsers.users[i].id);
                            }
                        }
                    }
                }
                if (harvestUsers.next_page) {
                    nextPage = harvestUsers.next_page;
                }

                if (userAssignments.length > 0 && userAssignments.length === users.length) {
                    usersMatched = true;
                }

            } while (nextPage && !usersMatched)

            if (userAssignments.length > 0) {
                const existingAssignments = existingProject.projectUserAssignments;
                const removedUsers = existingAssignments.filter(existing => userAssignments.includes(existing.userId.toString()));

                await Promise.all(userAssignments.map(async (userId) => {
                    const found = existingAssignments?.find(existing => existing.userId.toString() === userId.toString());
                    if (!found) {
                        const userAssignment = await harvest.assignUserToProject(user.harvestAccessToken, existingProject.projectId, userId);
                        await database.createProjectUserAssignment({ userId, projectId: existingProject.id, userAssignmentId: userAssignment.id });
                    }
                }));

                if (removedUsers) {
                    await Promise.all(removedUsers.map(async (assignment) => {
                        await harvest.removeUserFromProject(user.harvestAccessToken, existingProject.projectId, assignment.userAssignmentId);
                        await database.removeProjectUserAssignment(assignment);
                    }));
                }
            }
        }

        if (project.tasks) {
            
            // TODO Remove existing tasks that are not in the new list

            const existingAssignments = existingProject.projectTaskAssignments;
            let accountTasks = [];
            let queriedAccountTasks = false;
            let harvestTasks = [];
            let queriedHarvestTasks = false;

            for (let i=0;i<project.tasks.length;i++) {
                const task = project.tasks[i];

                // See if the task is already assigned to the project
                const existingTaskAssignment = existingAssignments?.find(existing => existing.itemId.toString() === task.itemId.toString() && existing.boardId.toString() === task.boardId.toString());
                if (existingTaskAssignment) {
                    // If there is an existing task, we shouldn't need to do anything, we should probably update 
                    await harvest.updateTask(user.harvestAccessToken, existingTaskAssignment.task.taskId, { name: task.name });
                    continue;
                }

                if (!queriedAccountTasks) {
                    accountTasks = await database.findTasksByAccountId(accountId);
                    queriedAccountTasks = true;
                }

                // Check to see if a task with the same name is already mapped to the account
                const foundTask = accountTasks.find(existing => existing.taskName.toLowerCase() === task.name.toLowerCase());
                if (foundTask) {
                    const projectTaskAssignment = await harvest.assignTaskToProject(user.harvestAccessToken, existingProject.projectId, foundTask.taskId);
                    await database.createProjectTaskAssignment({ projectId: existingProject.id, taskAssignmentId: projectTaskAssignment.id, itemId: task.itemId, boardId: task.boardId, taskId: foundTask.id, accountId });
                    continue;
                }

                // Check if see if a task with this name already exists
                if (!queriedHarvestTasks) {
                    let nextPage = null;
                    do {
                        const tasks = await harvest.getTasks(user.harvestAccessToken, nextPage);
                        if (tasks.tasks.length > 0) {
                            harvestTasks = harvestTasks.concat(tasks.tasks);
                        }
                        if (tasks.next_page) {
                            nextPage = tasks.next_page;
                        }
                    } while (nextPage)
                }

                const foundHarvestTask = harvestTasks.find(existing => existing.name.toLowerCase() === task.name.toLowerCase());
                if (foundHarvestTask) {
                    const projectTaskAssignment = await harvest.assignTaskToProject(user.harvestAccessToken, existingProject.projectId, foundHarvestTask.id);
                    const databaseTask = await database.createTask({ accountId, taskName: task.name, taskId: foundHarvestTask.id });
                    await database.createProjectTaskAssignment({ projectId: existingProject.id, taskAssignmentId: projectTaskAssignment.id, itemId: task.itemId, boardId: task.boardId, taskId: databaseTask.id, accountId });
                    continue;
                }

                // If we get here, we need to create a new task
                const newTask = await harvest.createTask(user.harvestAccessToken, { name: task.name });
                const databaseTask = await database.createTask({ accountId, taskName: task.name, taskId: newTask.id });
                const projectTaskAssignment = await harvest.assignTaskToProject(user.harvestAccessToken, existingProject.projectId, newTask.id);
                await database.createProjectTaskAssignment({ projectId: existingProject.id, taskAssignmentId: projectTaskAssignment.id, itemId: task.itemId, boardId: task.boardId, taskId: databaseTask.id, accountId });
            }
        }
        return res.status(200).send({ message: "Successfully completed action" });
    } catch (err) {
        logger.log(`action-controller.createProject - An unknown error has occured - ${err.message}`, null, 'error', { project, remediation: err.message, userId, accountId, boardId, itemId, error: { name: err.name, message: err.message, stack: err.stack }})
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle": "Unable to create project",
            "notificationErrorDescription": "Error: " + err.message,
            "runtimeErrorDescription": "Error: " + err.message,
        });
    }
}

const createTaskConnectedProject = async(req, res) => {
    try {
        const { accountId, userId, shortLivedToken, user } = req.session;
        const { payload } = req.body;
        const { inboundFieldValues } = payload;
        const { boardId, itemId, task, projectColumnId,  } = inboundFieldValues;

        logger.log('action-controller.createTaskConnectedProject', req, 'info', { userId, accountId, task, itemId, boardId, projectColumnId })
        if (!task.name) {
            logger.log("action-controller.createTaskConnectedProject - Task name has not been mapped", req, 'info', { userId, accountId, task, itemId, boardId, projectColumnId, remediation: 'Task name is a required field' })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create task",
                "notificationErrorDescription": "Task name has not been mapped or is empty",
                "runtimeErrorDescription": "Task name has not been mapped or is empty",
            });
        }

        if (!projectColumnId) {
            logger.log("action-controller.createTaskConnectedProject - Project column has not been mapped", req, 'info', { userId, accountId, task, itemId, boardId, projectColumnId, remediation: 'Project column is a required field' })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create task",
                "notificationErrorDescription": "Project column has not been mapped or is empty",
                "runtimeErrorDescription": "Project column has not been mapped or is empty",
            });
        }

        let { error, response, max_complexity_exceeded } = await monday.queryItemColumnValues(shortLivedToken, itemId, projectColumnId);
        if (error) {
            //Send monday.com notification
            console.error("action-controller.createTaskConnectedProject - error retrieving connected column information", { error: error, itemId, userId, accountId, task, projectColumnId, boardId });
            
            if (max_complexity_exceeded) {
                console.error("action-controller.createTaskConnectedProject - complexity limit reached", { error: error, itemId, userId, accountId, task, projectColumnId, boardId });
                logger.info("action-controller.createTaskConnectedProject - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message }, itemId, userId, accountId, task, projectColumnId, boardId });
    
                return res.status(429).send({
                    message: "complexity limit reached"
                });
            }

            logger.info("action-controller.createTaskConnectedProject - error retrieving connected column information", req, 'error', { error: { name: error.name, message: error.message, stack: error.stack }, itemId, userId, accountId, task, projectColumnId, boardId });
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create task",
                "notificationErrorDescription": "An error occured retrieving project from connected board column",
                "runtimeErrorDescription": "An error occured retrieving project from connected board column",
            });
        }

        const projectItemId = response.data.items?.[0]?.column_values?.[0]?.linked_items?.[0]?.id ?? null;
        if (!projectItemId) {
            logger.log("action-controller.createTaskConnectedProject - No project item found", req, 'info', { userId, accountId, task, itemId, boardId, projectColumnId, remediation: 'Project column is a required field' })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create task",
                "notificationErrorDescription": "Project has not been found",
                "runtimeErrorDescription": "Project has not been found",
            });
        }

        const projectBoardId = response.data.items?.[0]?.column_values?.[0]?.linked_items?.[0]?.board?.id ?? null;

        const project = await database.findProjectItemByItemId(accountId, projectBoardId, projectItemId);
        if (!project) {
            logger.log("action-controller.createTaskConnectedProject - No project found", req, 'info', { userId, accountId, task, itemId, boardId, projectColumnId, projectItemId: response.data.items[0].column_values[0].linked_items[0].id,  remediation: 'Project column is a required field' })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create task",
                "notificationErrorDescription": "Project has not been found",
                "runtimeErrorDescription": "Project has not been found",
            });
        }

        const existingAssignments = project.projectTaskAssignments;

        // See if the task is already assigned to the project
        const existingTaskAssignment = existingAssignments?.find(existing => existing.itemId.toString() === itemId.toString() && existing.boardId.toString() === boardId.toString());
        if (existingTaskAssignment) {

            let taskAssignmentId = existingTaskAssignment.taskAssignmentId;
            if (!taskAssignmentId) {
                // search harvest for the task assignment
                const taskAssignment = await harvest.findTaskAssignment(user.harvestAccessToken, project.projectId, existingTaskAssignment.task.taskId);
                taskAssignmentId = taskAssignment.id;
                await database.updateProjectTaskAssignment(existingTaskAssignment, { projectId: project.id, taskAssignmentId, itemId: itemId, boardId: boardId, taskId: existingTaskAssignment.task.taskId, accountId });
            }

            // If there is an existing task, we shouldn't need to do anything, we should probably update 
            await harvest.updateTask(user.harvestAccessToken, existingTaskAssignment.task.taskId, { name: task.name });
            await harvest.updateTaskAssignment(user.harvestAccessToken, project.projectId, taskAssignmentId, task );
            return res.status(200).send({ message: "Successfully completed action" });
        }

        let accountTasks = [];
        let queriedAccountTasks = false;
        let harvestTasks = [];
        let queriedHarvestTasks = false;

        if (!queriedAccountTasks) {
            accountTasks = await database.findTasksByAccountId(accountId);
            queriedAccountTasks = true;
        }

        // Check to see if a task with the same name is already mapped to the account
        const foundTask = accountTasks.find(existing => existing.taskName.toLowerCase() === task.name.toLowerCase());
        if (foundTask) {
            const projectTaskAssignment = await harvest.assignTaskToProject(user.harvestAccessToken, project.projectId, foundTask.taskId, task);
            await database.createProjectTaskAssignment({ projectId: project.id, taskAssignmentId: projectTaskAssignment.id, itemId: itemId, boardId: boardId, taskId: foundTask.id, accountId });
            return res.status(200).send({ message: "Successfully completed action" });
        }

        // Check if see if a task with this name already exists
        if (!queriedHarvestTasks) {
            let nextPage = null;
            do {
                const tasks = await harvest.getTasks(user.harvestAccessToken, nextPage);
                if (tasks.tasks.length > 0) {
                    harvestTasks = harvestTasks.concat(tasks.tasks);
                }
                if (tasks.next_page) {
                    nextPage = tasks.next_page;
                }
            } while (nextPage)
        }

        const foundHarvestTask = harvestTasks.find(existing => existing.name.toLowerCase() === task.name.toLowerCase());
        if (foundHarvestTask) {
            const projectTaskAssignment = await harvest.assignTaskToProject(user.harvestAccessToken, project.projectId, foundHarvestTask.id, task);
            const databaseTask = await database.createTask({ accountId, taskName: task.name, taskId: foundHarvestTask.id });
            await database.createProjectTaskAssignment({ projectId: project.id, taskAssignmentId: projectTaskAssignment.id, itemId: itemId, boardId: boardId, taskId: databaseTask.id, accountId });
            return res.status(200).send({ message: "Successfully completed action" });
        }

        // If we get here, we need to create a new task
        const newTask = await harvest.createTask(user.harvestAccessToken, { name: task.name });
        const databaseTask = await database.createTask({ accountId, taskName: task.name, taskId: newTask.id });
        const projectTaskAssignment = await harvest.assignTaskToProject(user.harvestAccessToken, project.projectId, newTask.id, task);
        await database.createProjectTaskAssignment({ projectId: project.id, taskAssignmentId: projectTaskAssignment.id, itemId: itemId, boardId: boardId, taskId: databaseTask.id, accountId });

        return res.status(200).send({ message: "Successfully completed action" });
    } catch (err) {
        logger.log(`action-controller.createTaskConnectedProject - An unknown error has occured - ${err.message}`, req, 'error', { remediation: err.message, error: err})
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle": "Unable to create task",
            "notificationErrorDescription": "Error: " + err.message,
            "runtimeErrorDescription": "Error: " + err.message,
        });
    }
}

const createProjectMappedClient = async(req, res) => {
    try {
        
        const { accountId, userId, shortLivedToken, user } = req.session;
        const { payload } = req.body;
        const { inboundFieldValues } = payload;

        const { project, boardId, itemId } = inboundFieldValues;

        logger.log(`action-controller.createProjectMappedClient - Attempt to create a new project`, req, 'info', { userId, accountId, project, itemId, boardId })

        let clientName = null;
        if (project.client) {
            clientName = project.client
        }

        if (!clientName) {
            logger.log("action-controller.createProjectMappedClient - Client name has not been mapped", req, 'info', { clientName, remediation: 'Client name is a required field', userId, accountId, boardId, itemId })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create project",
                "notificationErrorDescription": "Client name has not been mapped or is empty",
                "runtimeErrorDescription": "Client name has not been mapped or is empty",
            });
        }

        let foundExistingClient = false;
        let nextPage = null;
        let existingClients = [];
        let existingClient = null;
        let clientId = null;

        do {
            existingClients = await harvest.getClients(user.harvestAccessToken, nextPage)
            if (existingClients.clients.length > 0) {
                for (let i=0;i<existingClients.clients.length;i++) {
                    if (existingClients.clients[i].name.toLowerCase() === clientName.toLowerCase()) {
                        foundExistingClient = true;
                        existingClient = existingClients.clients[i];
                        clientId = existingClient.id;
                        break;
                    }
                }
            }
            if (existingClients.next_page) {
                nextPage = existingClients.next_page;
            }
        } while (nextPage && !foundExistingClient)
        
        if (existingClient) {
            //we have found an existing harvest client with the same name, Harvest only allows unique client names, so lets sync this one up
            logger.log(`action-controller.createProjectMappedClient - Harvest client found with matching name`, req, 'info', { itemId, userId, accountId, boardId, existingClient })
            let newClient = await database.createClientToItem({
                accountId,
                boardId,
                itemId,
                clientId: existingClient.id,
            });

            clientId = existingClient.id;
            logger.log("action-controller.createProjectMappedClient - Successfully stored client", req, 'info', { itemId, userId, accountId, boardId, existingClient })
        } else {
            //No client has been found with the same name, so lets create a new client
            logger.log("action-controller.createProjectMappedClient - No Harvest client found with matching name", req, 'info', { itemId, userId, accountId, boardId })

            let harvestClient = await harvest.createClient(user.harvestAccessToken, { name: clientName })
            clientId = harvestClient.id;

            await database.createClientToItem({
                accountId,
                boardId,
                itemId,
                clientId: harvestClient.id,
            });

            logger.log("action-controller.createProjectMappedClient - Successfully created a new client", req, 'info', { itemId, userId, accountId, boardId, clientId: harvestClient.id })
        }

        project.client_id = clientId;
        return await createProject(req, res, project);
    } catch (err) {
        logger.error("action-controller.createProjectMappedClient - An unknown error has occured: " + err.message, req, err);
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const createTimesheetItem = async(req, res) => {
    const { accountId, userId, shortLivedToken } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues } = payload;
    const { timeEntry, itemMapping, boardId } = inboundFieldValues;

    try {
        logger.log(`action-controller.createTimesheetItem - Attempt to create/sync an item.`, req, 'info', { userId, accountId, payload })

        let groupId = itemMapping["__groupId__"];
        delete itemMapping.__groupId__;

        let itemMappingKeys = Object.keys(itemMapping);
        for (var i = 0; i < itemMappingKeys.length; i++) {
            let column = itemMappingKeys[i]

            const iso8601 = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

            if (iso8601.test(itemMapping[column])) {
                itemMapping[column] = DateTime.fromISO(itemMapping[column]).setZone('utc').toFormat('yyyy-MM-dd HH:mm:ss');
            }

            if (typeof itemMapping[column] === 'string' || itemMapping[column] instanceof String) {
                let tagMatches = /(?<=;)[^;]+(?=;)/g
                if (/(?<=;)[^;]+(?=;)/g.test(itemMapping[column])) {
                    let result = itemMapping[column].matchAll(tagMatches);
                    let tags = Array.from(result, x => x[0])
                    itemMapping[column] = tags.join(',')
                }
            }

            if (typeof itemMapping[column] === 'boolean' || itemMapping[column] instanceof Boolean) {
                itemMapping[column] = itemMapping[column].toString();
                if (itemMapping[column]) {
                    // Capitilise first letter
                    itemMapping[column] = itemMapping[column].charAt(0).toUpperCase() + itemMapping[column].slice(1);
                }
            }

            if (itemMapping[column] && itemMapping[column].identifierType === "email") {
                let { response, error, max_complexity_exceeded } = await monday.queryUsers(shortLivedToken);
                if (max_complexity_exceeded) {
                    console.error("action-controller.createTimesheetItem - complexity limit reached", { error: error, boardId });
                    logger.info("action-controller.createTimesheetItem - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message }});
                }

                for (var x = 0; x < response.data.users.length; x++) {
                    if (response.data.users[x].email === itemMapping[column].identifierValue[0]) {
                        itemMapping[column] = { "personsAndTeams": [{ "id": response.data.users[x].id, "kind": "person" }] }
                        break;
                    }
                }
            }
        }

        let timeentryItem = await database.findTimeEntryById(accountId, boardId, timeEntry.id);
        if (!timeentryItem) {
            logger.log("action-controller.createTimesheetItem - Existing item not found for " + timeEntry.id, req, 'info', { timeEntry, itemMapping, boardId, userId, accountId })
            //No linked item, so lets create a new item

            let name = itemMapping.name ? itemMapping.name : "New Time Entry";
            delete itemMapping.name;

            let { error, response, max_complexity_exceeded } = await monday.createItem(shortLivedToken, parseInt(boardId), groupId, name, JSON.stringify(itemMapping));
            if (error) {
                if (max_complexity_exceeded) {
                    logger.log("action-controller.createTimesheetItem - complexity limit reached", req, 'info', { error, timeEntry, itemMapping, boardId, userId, accountId });
                    return res.status(429).send({
                        message: "complexity limit reached"
                    });
                }

                logger.log("action-controller.createTimesheetItem - error creating new item", req, 'info', { error, timeEntry, itemMapping, boardId, userId, accountId });
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to create item from Time Entry",
                    "notificationErrorDescription": `Unable to create item from Time Entry - ${error.message}`,
                    "runtimeErrorDescription": `Unable to create item from Time Entry - ${error.message}`,
                });
            }

            const itemId = response.data.create_item.id;
            await database.createTimesheetItem({ accountId, itemId, boardId, timesheetId: timeEntry.id});
            logger.log("action-controller.createTimesheetItem - Successfully created item", req, 'info', { timeEntry, itemMapping, boardId, userId, accountId, itemId })


        } else {
            logger.log("action-controller.createTimesheetItem - Existing item found for " + timeEntry.id, req, 'info', { timeEntry, itemMapping, boardId, userId, accountId, timeSheetItem: timeentryItem.id })

            let { error, response, max_complexity_exceeded } = await monday.changeMultipleColumnValues(shortLivedToken, parseInt(boardId), parseInt(timeentryItem.itemId), JSON.stringify(itemMapping));
            if (error) {
                console.log(error);
                if (max_complexity_exceeded) {
                    logger.log("action-controller.createTimesheetItem - error updating item", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message }, timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId });
                    return res.status(429).send({
                        message: "complexity limit reached"
                    });
                }

                if (error.message) {
                    logger.log("action-controller.createTimesheetItem - error updating item", req, 'error', { error: { name: error.name, message: error.message, stack: error.stack }, timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId });
                    return res.status(400).send({
                        "severityCode" : 4000,
                        "notificationErrorTitle": "Unable to update item from Time Entry",
                        "notificationErrorDescription": `Unable to update item from Time Entry - ${error.message}`,
                        "runtimeErrorDescription": `Unable to update item from Time Entry - ${error.message}`,
                    });
                } else {
                    logger.log("action-controller.createTimesheetItem - error updating item", req, 'error', { error, timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId });
                    return res.status(400).send({
                        "severityCode" : 4000,
                        "notificationErrorTitle": "Unable to update item from Time Entry",
                        "notificationErrorDescription": `Unable to update item from Time Entry - ${error}`,
                        "runtimeErrorDescription": `Unable to update item from Time Entry - ${error}`,
                    });
                }
            }

            logger.log("action-controller.createTimesheetItem - Successfully updated item", req, 'info', { timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId })
        }

        return res.status(200).send({ message: "success" });

    } catch (err) {
        logger.log("action-controller.createTimesheetItem - An unknown error has occured", req, 'error', { error: err, timeEntry, itemMapping, boardId, userId, accountId });
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const createTimesheetItemConnectTask = async(req, res) => {
    const { accountId, userId, shortLivedToken } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues } = payload;
    const { timeEntry, itemMapping, boardId, taskId, taskColumnId } = inboundFieldValues;

    try {
        logger.log(`action-controller.createTimesheetItemConnectTask - Attempt to create/sync an item.`, req, 'info', { userId, accountId, payload })

        let groupId = itemMapping["__groupId__"];
        delete itemMapping.__groupId__;

        let itemMappingKeys = Object.keys(itemMapping);
        for (var i = 0; i < itemMappingKeys.length; i++) {
            let column = itemMappingKeys[i]

            const iso8601 = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

            if (iso8601.test(itemMapping[column])) {
                itemMapping[column] = DateTime.fromISO(itemMapping[column]).setZone('utc').toFormat('yyyy-MM-dd HH:mm:ss');
            }

            if (typeof itemMapping[column] === 'string' || itemMapping[column] instanceof String) {
                let tagMatches = /(?<=;)[^;]+(?=;)/g
                if (/(?<=;)[^;]+(?=;)/g.test(itemMapping[column])) {
                    let result = itemMapping[column].matchAll(tagMatches);
                    let tags = Array.from(result, x => x[0])
                    itemMapping[column] = tags.join(',')
                }
            }

            if (typeof itemMapping[column] === 'boolean' || itemMapping[column] instanceof Boolean) {
                itemMapping[column] = itemMapping[column].toString();
                if (itemMapping[column]) {
                    // Capitilise first letter
                    itemMapping[column] = itemMapping[column].charAt(0).toUpperCase() + itemMapping[column].slice(1);
                }
            }

            if (itemMapping[column] && itemMapping[column].identifierType === "email") {
                let { response, error, max_complexity_exceeded } = await monday.queryUsers(shortLivedToken);
                if (error) {
                    if (max_complexity_exceeded) {
                        logger.log("action-controller.createTimesheetItemConnectTask - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message }, timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId });
                    }
                }

                for (var x = 0; x < response.data.users.length; x++) {
                    if (response.data.users[x].email === itemMapping[column].identifierValue[0]) {
                        itemMapping[column] = { "personsAndTeams": [{ "id": response.data.users[x].id, "kind": "person" }] }
                        break;
                    }
                }
            }
        }

        let timeentryItem = await database.findTimeEntryById(accountId, boardId, timeEntry.id);
        if (!timeentryItem) {
            logger.log("action-controller.createTimesheetItemConnectTask - Existing item not found for " + timeEntry.id, req, 'info', { timeEntry, itemMapping, boardId, userId, accountId })
            //No linked item, so lets create a new item

            let name = itemMapping.name ? itemMapping.name : "New Time Entry";
            delete itemMapping.name;

            let { error, response, max_complexity_exceeded } = await monday.createItem(shortLivedToken, parseInt(boardId), groupId, name, JSON.stringify(itemMapping));
            if (error) {
                if (max_complexity_exceeded) {
                    logger.log("action-controller.createTimesheetItemConnectTask - complexity limit reached", req, 'info', { error, timeEntry, itemMapping, boardId, userId, accountId });
                    return res.status(429).send({
                        message: "complexity limit reached"
                    });
                }
                
                logger.log("action-controller.createTimesheetItemConnectTask - error creating new item", req, 'info', { error, timeEntry, itemMapping, boardId, userId, accountId });
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to create item from Time Entry",
                    "notificationErrorDescription": `Unable to create item from Time Entry - ${error.message}`,
                    "runtimeErrorDescription": `Unable to create item from Time Entry - ${error.message}`,
                });
            }

            const itemId = response.data.create_item.id;
            timeentryItem = await database.createTimesheetItem({ accountId, itemId, boardId, timesheetId: timeEntry.id});
            logger.log("action-controller.createTimesheetItemConnectTask - Successfully created item", req, 'info', { timeEntry, itemMapping, boardId, userId, accountId, itemId })


        } else {
            logger.log("action-controller.createTimesheetItemConnectTask - Existing item found for " + timeEntry.id, req, 'info', { timeEntry, itemMapping, boardId, userId, accountId, timeSheetItem: timeentryItem.id })

            let { error, response, max_complexity_exceeded } = await monday.changeMultipleColumnValues(shortLivedToken, parseInt(boardId), parseInt(timeentryItem.itemId), JSON.stringify(itemMapping));
            if (error) {
                if (max_complexity_exceeded) {
                    logger.log("action-controller.createTimesheetItemConnectTask - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message }, timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId });
                    return res.status(429).send({
                        message: "complexity limit reached"
                    });
                }

                logger.log("action-controller.createTimesheetItemConnectTask - error updating item", req, 'error', { error: { name: error.name, message: error.message, stack: error.stack }, timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId });
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to update item from Time Entry",
                    "notificationErrorDescription": `Unable to update item from Time Entry - ${error.message}`,
                    "runtimeErrorDescription": `Unable to update item from Time Entry - ${error.message}`,
                });
            }

            logger.log("action-controller.createTimesheetItemConnectTask - Successfully updated item",req, 'info',  { timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId })
        }

        if (taskId) {
            let { error, response, max_complexity_exceeded } = await monday.queryColumn(shortLivedToken, parseInt(boardId), taskColumnId);
            if (error) {
                if (max_complexity_exceeded) {
                    logger.log("action-controller.createTimesheetItemConnectTask - complexity limit reached", req, 'info',  { error, timeEntry, itemMapping, boardId, userId, accountId, taskId, taskColumnId });
                    return res.status(429).send({
                        message: "complexity limit reached"
                    });
                }

                logger.log("action-controller.createTimesheetItemConnectTask - error querying connected column",req, 'info',  { error, timeEntry, itemMapping, boardId, userId, accountId, taskId, taskColumnId });
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to connect time entry to task",
                    "notificationErrorDescription": `Unable to connect time entry to task - ${error}`,
                    "runtimeErrorDescription": `Unable to connect time entry to task - ${error}`,
                });
            }

            const taskBoardIds = JSON.parse(response.data.boards[0].columns[0].settings_str).boardIds;

            const tasks = await database.findTasksOnBoard(taskId, accountId, taskBoardIds);
            if (tasks && tasks.length > 0) {
                const taskItemIds = tasks.map(task => task.itemId);
                let { error, response, max_complexity_exceeded } = await monday.changeMultipleColumnValues(shortLivedToken, parseInt(boardId), parseInt(timeentryItem.itemId), JSON.stringify({ [taskColumnId]: { item_ids: taskItemIds }} ));
                if (error) {
                    if (max_complexity_exceeded) {
                        logger.log("action-controller.createTimesheetItemConnectTask - complexity limit reached", req, 'info',  { error, timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId });
                        return res.status(429).send({
                            message: "complexity limit reached"
                        });
                    }

                    logger.log("action-controller.createTimesheetItemConnectTask - error updating item",req, 'info',  { error, timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId });
                    return res.status(400).send({
                        "severityCode" : 4000,
                        "notificationErrorTitle": "Unable to update item from Time Entry",
                        "notificationErrorDescription": `Unable to update item from Time Entry - ${error.message}`,
                        "runtimeErrorDescription": `Unable to update item from Time Entry - ${error.message}`,
                    });
                }
                logger.log("action-controller.createTimesheetItemConnectTask - Successfully connected tasks to item",req, 'info',  { timeEntry, itemMapping, boardId, userId, accountId, itemId: timeentryItem.itemId, taskItemIds })
            } else {
                logger.log("action-controller.createTimesheetItemConnectTask - No tasks found", req, 'info', { timeEntry, itemMapping, boardId, userId, accountId, taskId, taskColumnId, taskBoardIds });
            }
            
        } else {
            logger.log("action-controller.createTimesheetItemConnectTask - Task ID has not been sent", req, 'info', { userId, accountId, timeEntry, itemMapping, boardId, taskId, remediation: 'Task ID is a required field' })
        }

        return res.status(200).send({ message: "success" });

    } catch (err) {
        logger.log("action-controller.createTimesheetItem - An unknown error has occured", req, 'error', { error: { name: err.name, message: err.message, stack: err.stack }, timeEntry, itemMapping, boardId, userId, accountId });
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const updateTaskReportedTime = async(req, res) => {
    const { accountId, userId, shortLivedToken } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues } = payload;
    const { itemMapping, boardId, itemId, projectId, taskId } = inboundFieldValues;

    try {
        logger.log(`action-controller.updateTaskReportedTime - Attempt to update item with reported time`, req, 'info', { itemMapping, boardId, userId, accountId, itemId, projectId, taskId, payload })

        let groupId = itemMapping["__groupId__"];
        delete itemMapping.__groupId__;

        if (itemMapping.name && itemMapping.name.toLowerCase() === "new item") {
            delete itemMapping.name;
        }

        let itemMappingKeys = Object.keys(itemMapping);
        for (var i = 0; i < itemMappingKeys.length; i++) {
            let column = itemMappingKeys[i]

            const iso8601 = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

            if (iso8601.test(itemMapping[column])) {
                itemMapping[column] = DateTime.fromISO(itemMapping[column]).setZone('utc').toFormat('yyyy-MM-dd HH:mm:ss');
            }
        }


        let { error, response, max_complexity_exceeded } = await monday.changeMultipleColumnValues(shortLivedToken, parseInt(boardId), parseInt(itemId), JSON.stringify(itemMapping));
        if (error) {
            if (max_complexity_exceeded) {
                logger.log("action-controller.updateTaskReportedTime - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message, stack: error.stack }, itemMapping, boardId, userId, accountId, itemId, projectId, taskId });
                return res.status(429).send({
                    message: "complexity limit reached"
                });
            }

            logger.log("action-controller.updateTaskReportedTime - error updating item", req, 'error', { error: { name: error.name, message: error.message, stack: error.stack }, itemMapping, boardId, userId, accountId, itemId, projectId, taskId });
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to update item from Reported Time",
                "notificationErrorDescription": `Unable to update item from Reported Time - ${error.message}`,
                "runtimeErrorDescription": `Unable to update item from Reported Time - ${error.message}`,
            });
        }

        logger.log("action-controller.updateTaskReportedTime - Successfully updated item", req, 'info', { itemMapping, boardId, userId, accountId, itemId, projectId, taskId, payload })

        return res.status(200).send({ message: "success" });

    } catch (err) {
        logger.log("action-controller.updateTaskReportedTime - An unknown error has occured", req, 'error', { error: { name: err.name, message: err.message, stack: err.stack }, itemMapping, boardId, userId, accountId, itemId, projectId, taskId, payload });
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const updateTaskReportedTimeSubitem = async(req, res) => {
    const { accountId, userId, shortLivedToken } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues } = payload;
    const { reportedTime, boardId, itemId, projectId, taskId } = inboundFieldValues;

    try {
        logger.log(`action-controller.updateTaskReportedTimeSubitem - Attempt to update item with reported time.`, req, 'info', { reportedTime, boardId, userId, accountId, itemId, projectId, taskId, payload })

        let { error, response, max_complexity_exceeded } = await monday.queryColumns(shortLivedToken, parseInt(boardId));
        if (error) {
            if (max_complexity_exceeded) {
                logger.log("action-controller.updateTaskReportedTimeSubitem - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message, stack: error.stack }, reportedTime, boardId, userId, accountId, itemId, projectId, taskId });
                return res.status(429).send({
                    message: "complexity limit reached"
                });
            }

            logger.log("action-controller.updateTaskReportedTimeSubitem - error retrieving columns", req, 'error', { error: { name: error.name, message: error.message, stack: error.stack }, reportedTime, boardId, userId, accountId, itemId, projectId, taskId });
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to update item from Reported Time",
                "notificationErrorDescription": `Unable to update item from Reported Time - ${error.message}`,
                "runtimeErrorDescription": `Unable to update item from Reported Time - ${error.message}`,
            });
        }

        const columns = response.data.boards[0].columns;
        const columnValues = {};
        for (var i = 0; i < columns.length; i++) {
            const column = columns[i];
            if (column.title.toLowerCase() === 'hours') {
                columnValues[column.id] = reportedTime.hours;
            }
            if (column.title.toLowerCase() === 'hours without timer') {
                columnValues[column.id] = reportedTime.hours_without_timer;
            }
            if (column.title.toLowerCase() === 'rounded hours') {
                columnValues[column.id] = reportedTime.rounded_hours;
            }
            if (column.title.toLowerCase() === 'earliest time') {
                columnValues[column.id] = reportedTime.earliest_time;
            }
            if (column.title.toLowerCase() === 'latest time') {
                columnValues[column.id] = reportedTime.latest_time;
            }
        }


        ({ error, response, max_complexity_exceeded } = await monday.changeMultipleColumnValues(shortLivedToken, parseInt(boardId), parseInt(itemId), JSON.stringify(columnValues)));
        if (error) {
            if (max_complexity_exceeded) {
                logger.log("action-controller.updateTaskReportedTimeSubitem - complexity limit reached", req, 'error', {error: { name: "maxComplexityExceeded", message: error.message, stack: error.stack }, reportedTime, boardId, userId, accountId, itemId, projectId, taskId });
                return res.status(429).send({
                    message: "complexity limit reached"
                });
            }

            logger.log("action-controller.updateTaskReportedTimeSubitem - error updating item", req, 'error', {error: { name: error.name, message: error.message, stack: error.stack }, reportedTime, boardId, userId, accountId, itemId, projectId, taskId });
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to update item from Reported Time",
                "notificationErrorDescription": `Unable to update item from Reported Time - ${error.message}`,
                "runtimeErrorDescription": `Unable to update item from Reported Time - ${error.message}`,
            });
        }

        logger.log("action-controller.updateTaskReportedTimeSubitem - Successfully updated item", req, 'info', {reportedTime, boardId, userId, accountId, itemId, projectId, taskId, payload })

        return res.status(200).send({ message: "success" });

    } catch (err) {
        logger.log("action-controller.updateTaskReportedTimeSubitem - An unknown error has occured", req, 'error', { error: { name: err.name, message: err.message, stack: err.stack }, reportedTime, boardId, userId, accountId, itemId, projectId, taskId, payload });
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const createExpense = async (req, res) => {
    try {

        const { accountId, userId, shortLivedToken, user } = req.session;
        const { payload } = req.body;
        const { inboundFieldValues } = payload;
        const { boardId, itemId, projectColumnId, expense } = inboundFieldValues;

        logger.log(`action-controller.createExpense - Attempt to create a new expense`, req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense })

        let projectId = null;

        if (!expense.category) {
            logger.log("action-controller.createExpense - Category has not been mapped", req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create expense",
                "notificationErrorDescription": "Category has not been mapped or is empty",
                "runtimeErrorDescription": "Category has not been mapped or is empty",
            });
        }

        if (!expense.spent_date) {
            logger.log("action-controller.createExpense - Spent date has not been mapped", req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create expense",
                "notificationErrorDescription": "Spent date has not been mapped or is empty",
                "runtimeErrorDescription": "Spent date has not been mapped or is empty",
            });
        }

        if (projectColumnId) {
            //if the project is mapped, we need to search for the project ID

            let { error, response, max_complexity_exceeded } = await monday.queryItemColumnValues(shortLivedToken, itemId, projectColumnId);
            if (error) {
                //Send monday.com notification
                
                if (max_complexity_exceeded) {
                    logger.log("action-controller.createExpense - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message, stack: error.stack }, itemId, userId, accountId, boardId, projectColumnId, expense });
                    return res.status(429).send({
                        message: "complexity limit reached"
                    });
                }

                logger.log("action-controller.createExpense - error retrieving connected column information", req, 'error', { error: { name: error.name, message: error.message, stack: error.stack }, itemId, userId, accountId, boardId, projectColumnId, expense });
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to create expense",
                    "notificationErrorDescription": "An error occured retrieving project from connected board column",
                    "runtimeErrorDescription": "An error occured retrieving project from connected board column",
                });
            }

            let connectedItem = null;
            try {
                connectedItem = response.data.items[0].column_values[0].linked_items[0];
            } catch (err) {
                logger.log("action-controller.createExpense - No connected items found to link project", req, 'info', { remediation: 'Project is a required field', userId, accountId, itemId, boardId, projectColumnId, expense })
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to create expense",
                    "notificationErrorDescription": "Project has not been mapped or is empty in the connected item",
                    "runtimeErrorDescription": "Project has not been mapped or is empty in the connected item",
                });
            }

            let existingProject = await database.findProjectItemByItemIdOnly(accountId, connectedItem.id);
            // Search first for the matching item id, if not, search for the client name
            if (existingProject) {
                projectId = existingProject.projectId;
                logger.log("action-controller.createExpense - Harvest project from matching item id", req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense })
            } else {
                logger.log("action-controller.createExpense - The selected project is not in sync", req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense })
                return res.status(400).send({
                    "severityCode" : 4000,
                    "notificationErrorTitle": "Unable to create expense",
                    "notificationErrorDescription": "The selected project is not in sync, please sync the project to Harvest",
                    "runtimeErrorDescription": "The selected project is not in sync, please sync the project to Harvest",
                });
            }
        } else {
            logger.log("action-controller.createExpense - No project column has been mapped", req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create expense",
                "notificationErrorDescription": "Project column has not been mapped or is empty",
                "runtimeErrorDescription": "Project column has not been mapped or is empty",
            });
        }

        expense.project_id = projectId;
        logger.log(`action-controller.createExpense`, req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense })


        if (!expense.billable) {
            expense.billable = false;
        } else {
            expense.billable = expense.billable.toString();
            if (expense.billable.toLowerCase() === 'yes') {
                expense.billable = true;
            } else if (expense.billable.toLowerCase() === 'no') {
                expense.billable = false;
            } else if (expense.billable.toLowerCase() === 'false') {
                expense.billable = false;
            } else if (expense.billable.toLowerCase() === 'true') {
                expense.billable = true;
            } else {
                expense.billable = true;
            }
        }

        if (expense.category)  {
            let nextPage = null;
            do {
                const expenseCategories = await harvest.getExpenseCategories(user.harvestAccessToken, nextPage);
                if (expenseCategories.expense_categories.length > 0) {
                    for (let i=0;i<expenseCategories.expense_categories.length;i++) {
                        if (expense.category === `${expenseCategories.expense_categories[i]['name']}`) {
                            expense.expense_category_id = expenseCategories.expense_categories[i].id;
                            break;
                        }
                    }
                }
                if (expenseCategories.next_page) {
                    nextPage = existingExpense.next_page;
                }
            } while (nextPage && !expense.expense_category_id)
        }

        if (!expense.expense_category_id) {
            logger.log(`action-controller.createExpense - Expense category '${expense.category}' is not a valid category in Harvest`, req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense })
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create expense",
                "notificationErrorDescription": `Expense category '${expense.category}' is not a valid category in Harvest`,
                "runtimeErrorDescription": `Expense category '${expense.category}' is not a valid category in Harvest`,
            });
        }

        if (expense.user) {
            // People column, match by email
            let match = 'email';
            let users = [];
            if (expense.user.identifierValue) {
                users = expense.user.identifierValue;
            } else {
                match = 'name';
                users = expense.users;
            }

            let nextPage = null;
            do {
                const harvestUsers = await harvest.getUsers(user.harvestAccessToken, nextPage);
                if (harvestUsers.users.length > 0) {
                    for (let i=0;i<harvestUsers.users.length;i++) {
                        if (match === 'email') {
                            if (users.includes(harvestUsers.users[i]['email'].toLowerCase())) {
                                expense.user_id = harvestUsers.users[i].id;
                                break;
                            }
                        } else {
                            if (users.includes(`${harvestUsers.users[i]['first_name']} ${harvestUsers.users[i]['last_name']}`)) {
                                expense.user_id = harvestUsers.users[i].id;
                                break;
                            }
                        }
                    }
                }
                if (harvestUsers.next_page) {
                    nextPage = harvestUsers.next_page;
                }
            } while (nextPage && !expense.user_id)
        }

        let existingExpense = await database.findExpenseItemByItemId(accountId, boardId, itemId);
        if (existingExpense && existingExpense.id) {
            // //we have already synced with item with Clockify, lets update the Client just in case
            logger.log(`action-controller.createExpense - Existing expense item found: ${existingExpense.id}`, req, 'info', { userId, accountId, itemId, boardId, projectColumnId, expense, existingExpense })
            
            let harvestExpense = await harvest.updateExpense(user.harvestAccessToken, existingExpense.expenseId, expense);
            logger.log("action-controller.createExpense - Successfully updated expense", req, 'info', { itemId, expenseId: harvestExpense.id, expense, boardId, userId, accountId })
        } else {
            //it is a new item to sync, lets search for a Client with an existing name, otherwise we will create a new client'
            logger.log("action-controller.createExpense - No existing expense item found, creating", req, 'info', { itemId, expense, boardId, userId, accountId, projectColumnId })


            const harvestExpense = await harvest.createExpense(user.harvestAccessToken, expense)
            await database.createExpenseItem({
                accountId,
                boardId,
                itemId,
                expenseId: harvestExpense.id
            });
            existingExpense = await database.findExpenseItemByItemId(accountId, boardId, itemId);
            logger.log("action-controller.createExpense - Successfully created a new expense",  req, 'info', { itemId, expenseId: harvestExpense.id, expense, boardId, userId, accountId, projectColumnId })
        }

        return res.status(200).send({ message: "Successfully completed action" });
    } catch (err) {
        logger.error("action-controller.createExpense - An unknown error has occured: " + err.message, req, err);
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const createUpdateExpenseItem = async(req) => {
    const { accountId, userId, shortLivedToken } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues } = payload;
    const { expense, itemMapping, boardId } = inboundFieldValues;

    try {
        logger.log(`action-controller.createUpdateExpenseItem - Attempt to create/sync an item.`, req, 'info', { userId, accountId, payload })

        let groupId = itemMapping["__groupId__"];
        delete itemMapping.__groupId__;

        let itemMappingKeys = Object.keys(itemMapping);
        for (var i = 0; i < itemMappingKeys.length; i++) {
            let column = itemMappingKeys[i]

            const iso8601 = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

            if (iso8601.test(itemMapping[column])) {
                itemMapping[column] = DateTime.fromISO(itemMapping[column]).setZone('utc').toFormat('yyyy-MM-dd HH:mm:ss');
            }

            if (typeof itemMapping[column] === 'string' || itemMapping[column] instanceof String) {
                let tagMatches = /(?<=;)[^;]+(?=;)/g
                if (/(?<=;)[^;]+(?=;)/g.test(itemMapping[column])) {
                    let result = itemMapping[column].matchAll(tagMatches);
                    let tags = Array.from(result, x => x[0])
                    itemMapping[column] = tags.join(',')
                }
            }

            if (typeof itemMapping[column] === 'boolean' || itemMapping[column] instanceof Boolean) {
                itemMapping[column] = itemMapping[column].toString();
                if (itemMapping[column]) {
                    // Capitilise first letter
                    itemMapping[column] = itemMapping[column].charAt(0).toUpperCase() + itemMapping[column].slice(1);
                }
            }

            if (itemMapping[column] && itemMapping[column].identifierType === "email") {
                let { response, error, max_complexity_exceeded } = await monday.queryUsers(shortLivedToken);
                if (max_complexity_exceeded) {
                    logger.log("action-controller.createExpense - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message, stack: error.stack }});
                }

                for (var x = 0; x < response.data.users.length; x++) {
                    if (response.data.users[x].email === itemMapping[column].identifierValue[0]) {
                        itemMapping[column] = { "personsAndTeams": [{ "id": response.data.users[x].id, "kind": "person" }] }
                        break;
                    }
                }
            }
        }

        let expenseItem = await database.findExpenseById(accountId, boardId, expense.id);
        if (!expenseItem) {
            logger.log("action-controller.createUpdateExpenseItem - Existing item not found for " + expense.id, req, 'info', { expense, itemMapping, boardId, userId, accountId })
            //No linked item, so lets create a new item

            let name = itemMapping.name ? itemMapping.name : "New Expense";
            delete itemMapping.name;

            let { error, response, max_complexity_exceeded } = await monday.createItem(shortLivedToken, parseInt(boardId), groupId, name, JSON.stringify(itemMapping));
            if (error) {
                if (max_complexity_exceeded) {
                    logger.log("action-controller.createExpense - complexity limit reached", req, 'error', { error: { name: "maxComplexityExceeded", message: error.message, stack: error.stack }});
                }

                logger.log("action-controller.createUpdateExpenseItem- error creating new item", req, 'info', { error, expense, itemMapping, boardId, userId, accountId });
                return { status: 'error', error: error };
            }

            const itemId = response.data.create_item.id;
            expenseItem = await database.createExpenseItem({ accountId, itemId, boardId, expenseId: expense.id});
            logger.log("action-controller.createUpdateExpense - Successfully created item", req, 'info', { expense, itemMapping, boardId, userId, accountId, itemId })


        } else {
            logger.log("action-controller.createUpdateExpenseItem - Existing item found for " + expense.id, req, 'info', { expense, itemMapping, boardId, userId, accountId, expenseItem: expenseItem.id })

            let { error, response, max_complexity_exceeded } = await monday.changeMultipleColumnValues(shortLivedToken, parseInt(boardId), parseInt(expenseItem.itemId), JSON.stringify(itemMapping));
            if (error) {
                if (max_complexity_exceeded) {
                    console.error("action-controller.createUpdateExpenseItemm - complexity limit reached");
                }

                logger.log("action-controller.createUpdateExpenseItemm - error updating item", req, 'info', { error, expense, itemMapping, boardId, userId, accountId, itemId: expense.itemId });
                return { status: 'error', error: error };
            }

            logger.log("action-controller.createUpdateExpenseItem - Successfully updated item", req, 'info', { expense, itemMapping, boardId, userId, accountId, itemId: expenseItem.itemId })
        }

        return { status: 'success', error: null, expenseItem };
    } catch (err) {
        logger.log("action-controller.createExpenseItem- An unknown error has occured", req, 'error', { error: { name: err.name, message: err.message, stack: err.stack }, expense, itemMapping, boardId, userId, accountId });
        return { status: 'error', error: err };
    }
}

const createExpenseItem = async(req, res) => {
    const { accountId, userId, shortLivedToken } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues } = payload;
    const { expense, itemMapping, boardId } = inboundFieldValues;

    try {
        logger.log(`action-controller.createExpenseItem - Attempt to create/sync an item.`, req, 'info', { userId, accountId, payload })
        const createResponse = await createUpdateExpenseItem(req);
        if (createResponse.status === 'error') {
            logger.log("action-controller.createExpenseItem - error creating/updating item", req, 'error', { error: { name: createResponse.error.name, message: createResponse.error.message, stack: createResponse.error.stack }, expense, itemMapping, boardId, userId, accountId });
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create item from Expense",
                "notificationErrorDescription": `Unable to create item from Expense - ${createResponse.error.message}`,
                "runtimeErrorDescription": `Unable to create item from Expense - ${createResponse.error.message}`,
            });
        }

        logger.log("action-controller.createExpenseItem - Successfully created/updated item", req, 'info', { expense, itemMapping, boardId, userId, accountId, itemId: createResponse.expenseItem.itemId })
        return res.status(200).send({ message: "success" });

    } catch (err) {
        logger.log("action-controller.createExpenseItem - An unknown error has occured", req, 'error', { error: { name: err.name, message: err.message, stack: err.stack }, expense, itemMapping, boardId, userId, accountId });
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

const createExpenseItemWithFile = async(req, res) => {
    // return res.status(200).send({ message: "success" });
    const { accountId, userId, shortLivedToken, user } = req.session;
    const { payload } = req.body;
    const { inboundFieldValues } = payload;
    const { expense, itemMapping, boardId, fileColumnId } = inboundFieldValues;

    try {
        logger.log(`action-controller.createExpenseItemWithFile - Attempt to create/sync an item.`, req, 'info', { userId, accountId, payload })
        const createResponse = await createUpdateExpenseItem(req);
        if (createResponse.status === 'error') {
            logger.log("action-controller.createExpenseItemWithFile - error creating/updating item", req, 'error', { error: { name: createResponse.error.name, message: createResponse.error.message, stack: createResponse.error.stack }, expense, itemMapping, boardId, userId, accountId });
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "Unable to create item from Expense",
                "notificationErrorDescription": `Unable to create item from Expense - ${createResponse.error.message}`,
                "runtimeErrorDescription": `Unable to create item from Expense - ${createResponse.error.message}`,
            });
        }
        logger.log("action-controller.createExpenseItemWithFile - Successfully created/updated item", req, 'info', { expense, itemMapping, boardId, userId, accountId, itemId: createResponse.expenseItem.itemId })

        const expenseItem = createResponse.expenseItem;

        if (expense.receipt) {
            const receipt = expense.receipt;

            const receiptFile = await fetch(receipt.url, { method: 'GET', headers: { 'Authorization': `Bearer ${user.harvestAccessToken}` } });

            let { error, response, max_complexity_exceeded } = await monday.changeMultipleColumnValues(shortLivedToken, parseInt(boardId), parseInt(expenseItem.itemId), JSON.stringify({ [fileColumnId]: { 'clear_all': true } }));
            if (error) {
                if (max_complexity_exceeded) {
                    console.error("action-controller.createExpenseItemWithFile - complexity limit reached");
                    logger.log("action-controller.createExpenseItemWithFile - complexity limit reached", req, 'info', { expense, itemMapping, boardId, userId, accountId, itemId: createResponse.expenseItem.itemId })
                }
            }

            const receiptFileBuffer = await receiptFile.arrayBuffer();

            const upload = await monday.uploadFile(shortLivedToken, { buffer: Buffer.from(receiptFileBuffer, 'binary'), name: receipt.file_name }, expenseItem.itemId, fileColumnId);
            if (upload.data && upload.data.data && upload.data.data.add_file_to_column) {
                return res.status(200).send({ message: "success" });
            }
            return res.status(400).send({
                "severityCode" : 4000,
                "notificationErrorTitle": "An error occured uploading the receipt file",
                "notificationErrorDescription": `An error occured uploading the receipt file - ${upload.data.data.errors[0].message}`,
                "runtimeErrorDescription": `An error occured uploading the receipt file - ${upload.data.data.errors[0].message}`,
            });
        }
        return res.status(200).send({ message: "success" });

    } catch (err) {
        logger.log("action-controller.createExpenseItemWithFile - An unknown error has occured", req, 'error', { error: { name: err.name, message: err.message, stack: err.stack }, expense, itemMapping, boardId, userId, accountId });
        return res.status(400).send({
            "severityCode" : 4000,
            "notificationErrorTitle" : "An error has orccured",
            "notificationErrorDescription" : "An error has orccured "+ err.message,
            "runtimeErrorDescription" : "An error has orccured "+ err.message
        });
    }
}

module.exports = {
    createClient,
    createProjectConnectedClient,
    createProjectConnectedClientSubitemTasks,
    createTaskConnectedProject,
    createProjectMappedClient,
    createTimesheetItem,
    createTimesheetItemConnectTask,
    updateTaskReportedTime,
    updateTaskReportedTimeSubitem,
    createExpense,
    createExpenseItem,
    createExpenseItemWithFile,
}