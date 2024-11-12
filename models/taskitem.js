'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TaskItem.belongsTo(models.Task, {foreignKey: 'taskId', as: 'task'});
    }
  }
  TaskItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    accountId: DataTypes.STRING,
    itemId: DataTypes.STRING,
    boardId: DataTypes.STRING,
    taskId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'TaskItem',
  });
  return TaskItem;
};