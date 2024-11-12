# Harvest <> monday.com Integration

A monday.com Marketplace integration for Harvest. This has additional features to the monday.com built harvest integration allowing additional use cases

## Local Development
Initial setup, copy the .env.example file to .env and set the following env variables
`APP_SECRET=

PORT=
DB_USER=
DB_PASSWORD=
DB_DATABASE=harvest-monday

SQS_QUEUE_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=`
Generate an app secret at [text](https://randomkeygen.com/)
Set your local DB connection details
Obtain the AWS and SQS details from the AWS console or Mitchell or Shambhu
Create a new Harvest development app (for local testing) here - [text](https://id.getharvest.com/developers)
Obtain the monday.com App client details from the Luxie Tech monday.com developer account, access can be requested from Mitchell or Shambhu

To initialise the application, run the following commands
`npm install
npx sequelize-cli db:migrate
`

To start the application, run the following commands in 2 seperate terminals
`npm start
npm run start-consumer`

