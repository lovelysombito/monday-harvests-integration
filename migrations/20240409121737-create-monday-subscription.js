'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MondaySubscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accountId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      webhookUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subscriptionId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      webhookEvent: {
        type: Sequelize.STRING,
        allowNull: false
      },
      context: {
        type: Sequelize.STRING
      },
      recipeId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      integrationId: {
        type: Sequelize.STRING,
        allowNull: false
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
        allowNull: true,
        type: Sequelize.DATE,
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MondaySubscriptions');
  }
};