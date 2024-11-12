'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProjectTaskAssignment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProjectTaskAssignment.belongsTo(models.ProjectItem, {foreignKey: 'projectId', as: 'projectItem'});
      ProjectTaskAssignment.belongsTo(models.Task, {foreignKey: 'taskId', as: 'task'});
      ProjectTaskAssignment.belongsTo(models.TaskItem, {foreignKey: 'itemId', as: 'taskItem'});
    }
  }
  ProjectTaskAssignment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    taskAssignmentId: DataTypes.STRING,
    projectId: DataTypes.STRING,
    accountId: DataTypes.STRING,
    taskId: DataTypes.STRING,
    itemId: DataTypes.STRING,
    boardId: DataTypes.STRING,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ProjectTaskAssignment',
  });
  return ProjectTaskAssignment;
};