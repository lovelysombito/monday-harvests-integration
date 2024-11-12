'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProjectUserAssignment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
    }
  }
  ProjectUserAssignment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    projectId: DataTypes.STRING,
    userId: DataTypes.STRING,
    userAssignmentId: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'ProjectUserAssignment',
  });
  return ProjectUserAssignment;
};