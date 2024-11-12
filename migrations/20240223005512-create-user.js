'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      accountId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      harvestAccessToken: {
        type: Sequelize.STRING
      },
      harvestRefreshToken: {
        type: Sequelize.STRING
      },
      harvestTokenExpiresAt: {
        type: Sequelize.DATE
      },
      cookieAcceptance: {
        type: Sequelize.BOOLEAN
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
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};