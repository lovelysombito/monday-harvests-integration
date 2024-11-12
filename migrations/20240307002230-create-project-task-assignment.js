'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProjectTaskAssignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      accountId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      projectId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      taskId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      itemId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      boardId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProjectTaskAssignments');
  }
};