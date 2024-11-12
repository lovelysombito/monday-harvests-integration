const { LogService } = require('@jacktaylorgroup/upstream-logging');
const axios = require('axios');
const FormData = require('form-data');

const initMondayClient = require('monday-sdk-js');
const logger = new LogService();


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const mondayRequest = async (token, query, variables = null) => {
    let response = null;
    let completed = false;
    let count = 0;
    const mondayClient = initMondayClient({ token });
    do {
        response = await mondayClient.api(query, { variables });
        logger.log('monday-service.mondayRequest - Response', null, 'info', { query, variables, response })
        if (response.errors) {
            logger.log('monday-service.mondayRequest - error', null, 'error', { query, variables, response })
            if (response.errors[0] === 'Not Authenticated') {
                return { error: response, response: null, max_complexity_exceeded: false }
            }

            /**
             * Reference: https://developer.monday.com/api-reference/docs/errors
             */
            if (response.errors[0]?.extensions) {
                let error_codes = ['maxComplexityExceeded'];
                let extensions = response.errors[0].extensions;
                if (extensions?.code) {
                    let error_code = extensions.code;
                    if (error_codes.includes(error_code)) {
                        return { error: response.errors[0], response: null, max_complexity_exceeded: true }
                    }
                }
            }

            if (!response.errors[0].message?.startsWith('Query has complexity of')) {
                count = count + 1;
                await sleep(1000);
            } else {
                await sleep(60000);
            }
        } else if (response.error_message) {
            logger.log('monday-service.mondayRequest - error', null, 'error', { query, variables, response })
            if (!response.error_message?.startsWith('Query has complexity of')) {
                count = count + 1;
                await sleep(1000);
            } else {
                await sleep(60000);
            }
        } else {
            completed = true;
            return { error: null, response: response, max_complexity_exceeded: false }
        }

        if (count >= 2) {
            if (response.error_message) {
                return { error: response.error_message, response: null, max_complexity_exceeded: false }
            } else {
                return { error: response.errors[0].message, response: null, max_complexity_exceeded: false }
            }

        }

    } while (!completed);
}

const queryItemColumnValues = async (token, itemId, columnIds) => {
    const query = `query {
        items (ids:` + itemId + `) {
            name
            column_values(ids: "` + columnIds + `") {
                id
                value
                text
                ... on BoardRelationValue {
                    linked_items {
                        id
                        name
                        board {
                            id
                        }
                    }
                }
            }
            subitems {
                id
                name
                board {
                    id
                }
            }
        }
    }`;
    return await mondayRequest(token, query);
}

const queryUsers = async (token) => {
    const query = `query { users (limit: 500) { id email } }`;
    return await mondayRequest(token, query);
}

const querySubitemBoardId = async (token, boardId) => {
    const query = `query { boards(ids: ${boardId}) { columns (ids: ["subitems", "subtasks"]) { id type settings_str } } }`;
    return await mondayRequest(token, query);
}

const queryColumns = async (token, boardId) => {
    const query = `query { boards(ids: ${boardId}) { columns { id title type settings_str } } }`;
    return await mondayRequest(token, query);
}

const queryColumn = async (token, boardId, columnId) => {
    const query = `query { boards(ids: ${boardId}) { columns(ids: "${columnId}") { id title type settings_str } } }`;
    return await mondayRequest(token, query);
}

const createItem = async (token, boardId, groupId, itemName, columnValues) => {
    const query = `mutation create_item($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, group_id: $groupId, item_name:$itemName, column_values:$columnValues, create_labels_if_missing: true) {
            id
        }
      }
    `;
    let variables = { boardId: parseInt(boardId), groupId: groupId, itemName: itemName, columnValues: columnValues };
    return await mondayRequest(token, query, variables);
}

const changeMultipleColumnValues = async (token, boardId, itemId, columnValues) => {
    const query = `mutation change_multiple_column_values($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues, create_labels_if_missing: true) {
            id
        }
      }
    `;
    let variables = { boardId, itemId, columnValues };
    return await mondayRequest(token, query, variables);
}

const uploadFile = async (token, file, itemId, columnId) => {
    const form = new FormData();
    const query = `mutation ($file: File!) { add_file_to_column (file: $file, item_id: ${itemId}, column_id: "${columnId}") { id } }`;
    form.append('variables[file]', file.buffer, file.name);
    form.append('query', query);
    const headers = form.getHeaders();
    headers.Authorization = token;

    return axios.create({
        headers,
    }).post('https://api.monday.com/v2/file', form);
};

const testQueryHasComplexity = async (token) => {
    const query = `query {
        me {
            id
        }
        users {
            id
        }
        boards {
            groups {
                id
                items_page {
                    items {
                        id
                        column_values {
                            id
                        }
                    }
                }
            }
            columns {
                id
            }
            creator {
                id
            }
            activity_logs {
                id
            }
            items_page {
                items {
                    id
                    column_values {
                        id
                        type
                    }
                    group {
                        id
                    }
                    subitems {
                        id
                        column_values {
                            id
                        }
                    }
                }
            }
        }
    }`;
    return await mondayRequest(token, query);
}

module.exports = {
    queryItemColumnValues,
    queryUsers,
    createItem,
    changeMultipleColumnValues,
    querySubitemBoardId,
    queryColumns,
    queryColumn,
    uploadFile,
    testQueryHasComplexity
}