'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MondaySubscription extends Model {
  }
  MondaySubscription.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: DataTypes.STRING,
    accountId: DataTypes.STRING,
    webhookUrl: DataTypes.STRING,
    subscriptionId: DataTypes.STRING,
    webhookEvent: DataTypes.STRING,
    context: DataTypes.STRING,
    recipeId: DataTypes.STRING,
    integrationId: DataTypes.STRING,
    deletedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'MondaySubscription',
  });
  return MondaySubscription;
};