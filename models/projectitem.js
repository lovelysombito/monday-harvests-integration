'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProjectItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProjectItem.hasMany(models.ProjectUserAssignment, {foreignKey: 'projectId', as: 'projectUserAssignments'});
      ProjectItem.hasMany(models.ProjectTaskAssignment, {foreignKey: 'projectId', as: 'projectTaskAssignments'});
    }
  }
  ProjectItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    accountId: DataTypes.STRING,
    itemId: DataTypes.STRING,
    boardId: DataTypes.STRING,
    projectId: DataTypes.STRING,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    paranoid: true,
    modelName: 'ProjectItem',
  });
  return ProjectItem;
};