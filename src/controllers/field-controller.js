const { LogService } = require('@jacktaylorgroup/upstream-logging');
const monday = require('../services/monday');

const logger = new LogService();

const getClientFields = async (req, res) => {
    logger.log('field-controller.getClientField - Retrieve client field mapping', req, 'info')

    try {
        logger.log("field-controller.getClientField - Success", req, 'info')
        return res.status(200).send([
            { id: 'id', title: 'id', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'name', title: 'Client Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_active', title: 'Is Active', outboundType: 'boolean', inboundTypes: ['boolean'] },
            { id: 'address', title: 'Address', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'statement_key', title: 'Statement Key', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'currency', title: 'Currency', outboundType: 'text', inboundTypes: ['text'] },
        ]);
    } catch (err) {
        logger.error("field-controller.getClientField - An unknown error has occured", req,  err);
        return res.status(400).send({ message: "an error has occured" })
    }
}

const postClientFields = async (req, res) => {
    logger.log('field-controller.postClientFields - Retrieve client field mapping to post data', req, 'info')
    try {
        return res.status(200).send([
            { id: 'name', title: '*Client Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_active', title: 'Is Active', outboundType: 'boolean', inboundTypes: ['boolean'] },
            { id: 'address', title: 'Address', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'currency', title: 'Currency', outboundType: 'text', inboundTypes: ['text'] },
        ]);
    } catch (err) {
        logger.error("field-controller.postClientFields - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const getContactFields = async (req, res) => {
    logger.log('field-controller.getContactField - Retrieve contact field mapping', req, 'info')

    try {
        logger.log("field-controller.getContactField - Success")
        return res.status(200).send([
            { id: 'id', title: 'id', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'title', title: 'Title', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'client', title: 'Client', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'first_name', title: 'First Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'last_name', title: 'Last Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'email', title: 'Email', outboundType: 'text', inboundTypes: ['text', 'text_array'] },
            { id: 'phone_office', title: 'Phone - Office', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'phone_mobile', title: 'Phone - Mobile', outboundType: 'text', inboundTypes: ['text'] },
        ]);
    } catch (err) {
        logger.error("field-controller.getContactField - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const postContactFields = async (req, res) => {
    logger.log('field-controller.postContactFields - Retrieve contactt field mapping to post data', req, 'info')
    try {
        return res.status(200).send([
            { id: 'title', title: 'Title', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'client', title: 'Client', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'first_name', title: 'First Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'last_name', title: 'Last Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'email', title: 'Email', outboundType: 'text', inboundTypes: ['text', 'text_array'] },
            { id: 'phone_office', title: 'Phone - Office', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'phone_mobile', title: 'Phone - Mobile', outboundType: 'text', inboundTypes: ['text'] },
        ]);
    } catch (err) {
        logger.error("field-controller.postContactFields - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const getProjectFields = async (req, res) => {
    logger.log("field-controller.getProjectFields - Retrieve project field mapping", req, 'info');

    try {
        return res.status(200).send([
            { id: 'id', title: 'id', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'name', title: 'Project Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'client', title: 'Client', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'code', title: 'Code', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'notes', title: 'Notes', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_active', title: 'Is Active', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_billable', title: 'Is Billable', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_fixed_fee', title: 'Is Fixed Fee', ooutboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'bill_by', title: 'Bill By', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'hourly_rate', title: 'Hourly Rate', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'budget', title: 'Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'budget_is_monthly', title: 'Budget is Monthly', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'notify_over_budget', title: 'Notify when over budget (Harvest)', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'over_budget_notification_date', title: 'Over Budget Notification Date', outboundType: 'date', inboundTypes: ['date'] },
            { id: 'show_budget_to_all', title: 'Show Budget To All', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'cost_budget', title: 'Cost Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'cost_budget_include_expenses', title: 'Cost Budget - Include Expenses', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'fee_decimal', title: 'Fee Decimal', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'starts_on', title: 'Starts On', outboundType: 'date', inboundTypes: ['date'] },
            { id: 'ends_on', title: 'Ends On', outboundType: 'date', inboundTypes: ['date'] },

        ])
    } catch (err) {
        logger.error("field-controller.getProjectField - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const postProjectFields = async (req, res) => {
    logger.log("field-controller.getProjectFields - Retrieve project field mapping", req, 'info');
    
    try {
        return res.status(200).send([
            { id: 'name', title: '*Project Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'client', title: '*Client', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'code', title: 'Code', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'notes', title: 'Notes', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_active', title: 'Is Active', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_billable', title: '*Is Billable', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_fixed_fee', title: 'Is Fixed Fee', ooutboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'bill_by', title: '*Bill By', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'hourly_rate', title: 'Hourly Rate', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'budget', title: 'Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'budget_by', title: '*Budget By', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'budget_is_monthly', title: 'Budget is Monthly', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'notify_over_budget', title: 'Notify when over budget (Harvest)', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'over_budget_notification_date', title: 'Over Budget Notification Date', outboundType: 'date', inboundTypes: ['date'] },
            { id: 'show_budget_to_all', title: 'Show Budget To All', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'cost_budget', title: 'Cost Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'cost_budget_include_expenses', title: 'Cost Budget - Include Expenses', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'fee_decimal', title: 'Fee Decimal', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'starts_on', title: 'Starts On', outboundType: 'date', inboundTypes: ['date'] },
            { id: 'ends_on', title: 'Ends On', outboundType: 'date', inboundTypes: ['date'] },

        ])
    } catch (err) {
        logger.error("field-controller.getProjectField - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const postProjectConnectedClientFields = async (req, res) => {
    logger.log("field-controller.getProjectFields - Retrieve project field mapping", req, 'info');
    
    try {
        return res.status(200).send([
            { id: 'name', title: '*Project Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'code', title: 'Code', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'notes', title: 'Notes', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_active', title: 'Is Active', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_billable', title: '*Is Billable', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_fixed_fee', title: 'Is Fixed Fee', ooutboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'bill_by', title: '*Bill By', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'hourly_rate', title: 'Hourly Rate', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'budget', title: 'Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'budget_by', title: '*Budget By', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'budget_is_monthly', title: 'Budget is Monthly', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'notify_over_budget', title: 'Notify when over budget (Harvest)', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'over_budget_notification_date', title: 'Over Budget Notification Date', outboundType: 'date', inboundTypes: ['date'] },
            { id: 'show_budget_to_all', title: 'Show Budget To All', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'cost_budget', title: 'Cost Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'cost_budget_include_expenses', title: 'Cost Budget - Include Expenses', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'fee_decimal', title: 'Fee Decimal', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'starts_on', title: 'Starts On', outboundType: 'date_time', inboundTypes: ['date', 'date_time'] },
            { id: 'ends_on', title: 'Ends On', outboundType: 'date_time', inboundTypes: ['date', 'date_time'] },
            { id: 'users', title: "Users", outboundType: 'user_emails', inboundTypes: ['user_emails', 'text_array'] },
        ])
    } catch (err) {
        logger.error("field-controller.getProjectField - An unknown error has occured",req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const getTimesheetFields = async (req, res) => {
    logger.log("field-controller.getTimesheetFields - Retrieve timesheet field mapping", req, 'info')

    try {
        return res.status(200).send([
            // { id: 'id', title: 'id', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'spent_date', title: 'Spent Date', outboundType: 'date_time', inboundTypes: ['date_time'] },
            { id: 'user_emails', title: 'User', outboundType: 'user_emails', inboundTypes: ['user_emails'] },
            { id: 'user_name', title: 'User Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'client', title: 'Client', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'project', title: 'Project', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'project_code', title: 'Project Code', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'task', title: 'Task', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'external_reference', title: 'External Reference', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'invoice', title: 'Invoice', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'hours', title: 'Hours', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'hours_without_timer', title: 'Hours Without Timer', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'rounded_hours', title: 'Rounded Hours', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'notes', title: 'Notes', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_locked', title: 'Is Locked', outboundType: 'boolean', inboundTypes: ['boolean'] },
            { id: 'locked_reason', title: 'Locked Reason', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_closed', title: 'Is Closed', outboundType: 'boolean', inboundTypes: ['boolean'] },
            { id: 'is_billed', title: 'Is Billed', outboundType: 'boolean', inboundTypes: ['boolean'] },
            { id: 'timer_started_at', title: 'Timer Started At', outboundType: 'date_time', inboundTypes: ['date_time'] },
            { id: 'start_time', title: 'Start Time', outboundType: 'date_time', inboundTypes: ['date_time'] },
            { id: 'end_time', title: 'End Time', outboundType: 'date_time', inboundTypes: ['date_time'] },
            { id: 'is_running', title: 'Is Running', outboundType: 'boolean', inboundTypes: ['boolean'] },            
            { id: 'billable', title: 'Is Billable', outboundType: 'boolean', inboundTypes: ['boolean'] },            
            { id: 'budgeted', title: 'Is Budgeted', outboundType: 'boolean', inboundTypes: ['boolean'] },            
            { id: 'billable_rate', title: 'Billable Rate', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'cost_rate', title: 'Cost Rate', outboundType: 'numeric', inboundTypes: ['numeric'] },
        ])
    } catch (err) {
        logger.error("field-controller.getTimesheetField - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const postDurationTimesheetFields = async (req, res) => {
    logger.log("field-controller.postTimesheetFields - Retrieve timesheet field mapping", req, 'info')

    try {
        return res.status(200).send([
            { id: 'id', title: 'id', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'spent_date', title: 'Spent Date', outboundType: 'date_time', inboundTypes: ['date_time'] },
            // { id: 'project', title: 'Project', outboundType: 'text', inboundTypes: ['text'] },
            // { id: 'task', title: 'Task', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'hours', title: 'Hours', outboundType: 'numeric', inboundTypes: ['numeric'] },
        ])
    } catch (err) {
        logger.error("field-controller.getTimesheetField - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const postTimeEntryTimesheetFields = async (req, res) => {
    logger.log("field-controller.postTimesheetFields - Retrieve timesheet field mapping", req, 'info')

    try {
        return res.status(200).send([
            { id: 'notes', title: 'notes', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'spent_date', title: 'Spent Date', outboundType: 'date_time', inboundTypes: ['date_time'] },
            // { id: 'project', title: 'Project', outboundType: 'text', inboundTypes: ['text'] },
            // { id: 'task', title: 'Task', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'start_time', title: 'Start Time', outboundType: 'date_time', inboundTypes: ['date_time'] },
            { id: 'end_time', title: 'End Time', outboundType: 'date_time', inboundTypes: ['date_time'] },
        ])
    } catch (err) {
        logger.error("field-controller.getTimesheetField - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

// const getProjects = async (req, res) => {
//     logger.log("field-controller.getProjects - Retrieve projects", req, 'info')

//     try {
//         let data = await clockify.getProject(req.session.user.clockify_access_token, req.body.payload.workspaceId.value, encodeURI("archived=false&page-size=2000"), req);
//         logger.log("field-controller.getProjects - Success", req, 'info')
//         return res.status(200).send(data.map(project => ({ title: project.name, value: project.id })))

//     } catch (err) {
//         Sentry.captureException(err);
//         logger.error("field-controller.getProjects - An unknown error has occured", req, err);
//         return res.status(400).send({ message: "an error has occured" })
//     }
// }

const postTaskFields = async (req, res) => {
    logger.log('field-controller.postTaskFields - Retrieve task field mapping to post data', req, 'info')
    try {
        return res.status(200).send([
            { id: 'name', title: 'Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'budget', title: 'Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'hourly_rate', title: 'Hourly Rate', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'billable', title: 'Billable', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_active', title: 'Is Active', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
        ]);
    } catch (err) {
        logger.error("field-controller.postTaskFields - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const postProjectMappedClientFields = async (req, res) => {
    logger.log("field-controller.postProjectMappedClientFields - Retrieve project field mapping", req, 'info');
    
    try {
        return res.status(200).send([
            { id: 'client', title: '*Client Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'name', title: '*Project Name', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'code', title: 'Code', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'notes', title: 'Notes', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_active', title: 'Is Active', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_billable', title: '*Is Billable', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'is_fixed_fee', title: 'Is Fixed Fee', ooutboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'bill_by', title: '*Bill By', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'hourly_rate', title: 'Hourly Rate', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'budget', title: 'Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'budget_by', title: '*Budget By', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'budget_is_monthly', title: 'Budget is Monthly', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'notify_over_budget', title: 'Notify when over budget (Harvest)', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'over_budget_notification_date', title: 'Over Budget Notification Date', outboundType: 'date', inboundTypes: ['date'] },
            { id: 'show_budget_to_all', title: 'Show Budget To All', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'cost_budget', title: 'Cost Budget', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'cost_budget_include_expenses', title: 'Cost Budget - Include Expenses', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'fee_decimal', title: 'Fee Decimal', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'starts_on', title: 'Starts On', outboundType: 'date_time', inboundTypes: ['date', 'date_time'] },
            { id: 'ends_on', title: 'Ends On', outboundType: 'date_time', inboundTypes: ['date', 'date_time'] },
            { id: 'users', title: "Users", outboundType: 'user_emails', inboundTypes: ['user_emails', 'text_array'] },
        ])
    } catch (err) {
        logger.error("field-controller.postProjectMappedClientFields - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const getTaskReportedTimeFields = async (req, res) => {
    logger.log("field-controller.getTaskReportedTimeFields - Retrieve reported time field mapping", req, 'info')

    try {
        return res.status(200).send([
            { id: 'hours', title: 'Hours', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'hours_without_timer', title: 'Hours Without Timer', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'rounded_hours', title: 'Rounded Hours', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'earliest_time', title: 'First Reported Time', outboundType: 'date_time', inboundTypes: ['date_time'] },
            { id: 'latest_time', title: 'Latest Reported Time', outboundType: 'date_time', inboundTypes: ['date_time'] },
        ])
    } catch (err) {
        logger.error("field-controller.getTaskReportedTimeFields - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const getSubitemBoardId = async (req, res) => {
    logger.log("field-controller.getSubitemBoardId - Retrieve subitem board id", req, 'info')

    try {
        let { err, response } = await monday.querySubitemBoardId(req.session.shortLivedToken, req.body.payload.dependencyData.boardId);
        if (err) {
            logger.error("field-controller.getSubitemBoardId - An error has occured", req, err );
            return res.status(400).send({ message: "an error has occured" })
        }

        const column = response.data.boards[0].columns[0];
        const columnSettings = JSON.parse(column.settings_str);
        const subitemBoardId = columnSettings.boardIds[0];
        return res.status(200).send({ options: [{title: "Subitem Board", value: subitemBoardId }]});

    } catch (err) {
        logger.error("field-controller.getSubitemBoardId - An unknown error has occured", req,  err , req, 'info');
        return res.status(400).send({ message: "an error has occured" })
    }
};

const postExpenseFields = async (req, res) => {
    logger.log("field-controller.postExpenseFields - Retrieve expense field mapping", req, 'info');
    
    try {
        return res.status(200).send([
            { id: 'notes', title: 'Notes', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'billable', title: 'Billable', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'units', title: 'Units', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'total_cost', title: 'Total Cost', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'spent_date', title: 'Spent Date', outboundType: 'date', inboundTypes: ['date', 'date_time'] },
            { id: 'category', title: 'Expense Category', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'user', title: "User", outboundType: 'user_emails', inboundTypes: ['user_emails', 'text_array'] },
        ])
    } catch (err) {
        logger.error("field-controller.postExpenseFields - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

const getExpenseFields = async (req, res) => {
    logger.log("field-controller.getExpenseFields - Retrieve expense field mapping", req, 'info');
    
    try {
        return res.status(200).send([
            { id: 'notes', title: 'Notes', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'project', title: 'Project', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'project_code', title: 'Project Code', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'billable', title: 'Billable', outboundType: 'boolean', inboundTypes: ['boolean', 'text'] },
            { id: 'units', title: 'Units', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'total_cost', title: 'Total Cost', outboundType: 'numeric', inboundTypes: ['numeric'] },
            { id: 'spent_date', title: 'Spent Date', outboundType: 'date', inboundTypes: ['date', 'date_time'] },
            { id: 'category', title: 'Expense Category', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'user_emails', title: "User", outboundType: 'user_emails', inboundTypes: ['user_emails', 'text_array'] },
            { id: 'user_name', title: "User Name", outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_locked', title: 'Is Locked', outboundType: 'boolean', inboundTypes: ['boolean'] },
            { id: 'locked_reason', title: 'Locked Reason', outboundType: 'text', inboundTypes: ['text'] },
            { id: 'is_closed', title: 'Is Closed', outboundType: 'boolean', inboundTypes: ['boolean'] },
            { id: 'is_billed', title: 'Is Billed', outboundType: 'boolean', inboundTypes: ['boolean'] },
            { id: 'invoice_number', title: 'Invoice Number', outboundType: 'text', inboundTypes: ['text'] },
        ])
    } catch (err) {
        logger.error("field-controller.getExpenseFields - An unknown error has occured", req, err );
        return res.status(400).send({ message: "an error has occured" })
    }
}

module.exports = {
    getClientFields, 
    postClientFields,
    getContactFields,
    postContactFields,
    getProjectFields,
    postProjectFields,
    postProjectConnectedClientFields,
    getTimesheetFields,
    // postDurationTimesheetFields,
    // postTimeEntryTimesheetFields,
    postTaskFields,
    postProjectMappedClientFields,
    getTaskReportedTimeFields,
    getSubitemBoardId,
    postExpenseFields,
    getExpenseFields,
}