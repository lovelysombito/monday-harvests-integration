'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: DataTypes.STRING,
    accountId: DataTypes.STRING,
    harvestAccessToken: DataTypes.STRING,
    harvestRefreshToken: DataTypes.STRING,
    harvestTokenExpiresAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
    cookieAcceptance: DataTypes.BOOLEAN
  }, {
    sequelize,
    paranoid: true,
    modelName: 'User',
  });
  return User;
};