'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Task.hasMany(models.TaskItem, {foreignKey: 'taskId', as: 'taskItems'});
    }
  }
  Task.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    taskId: DataTypes.STRING,
    taskName: DataTypes.STRING,
    accountId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Task',
  });
  return Task;
};