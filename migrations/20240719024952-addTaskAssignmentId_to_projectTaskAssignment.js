'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(t => {
        return Promise.all([
          queryInterface.addColumn(
            'ProjectTaskAssignments',
            'taskAssignmentId',
            {
              type: Sequelize.DataTypes.STRING,
            },
            { transaction: t },
          ),
        ]);
      });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(t => {
        return Promise.all([
          queryInterface.removeColumn('ProjectTaskAssignments', 'taskAssignmentId', { transaction: t }),
        ]);
      });
  }
};
