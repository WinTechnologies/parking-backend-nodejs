# Parking MAPS Backend

This source code is part of [Node.js, Express.js, Sequelize.js and PostgreSQL].

To run locally:

* Run `npm install` or `yarn install`
* Internally Env variables declared in .env file are used.
* Run `npm run start:local`

PM2 is used for deploy in DEV, UAT, PROD environments. Please have look into following declarative files of PM2.

* pm2-maps-dev.json
* pm2-maps-uat.json
* pm2-maps-prod-BE.json
* pm2-maps-prod-FE.json

**DEV**

`pm2 start pm2-maps-dev.json --env development --only MAPS_BACK_DEV`

`pm2 start pm2-maps-dev.json --env development --only MAPS_BACK_DEV_WORKER1`

`pm2 start pm2-maps-dev.json --env development --only MAPS_FRONT_DEV`

`pm2 start pm2-maps-dev.json --env development --only OP_BACK_DEV`

`pm2 start pm2-maps-dev.json --env development --only OP_FRONT_DEV`

**UAT**

`pm2 start pm2-maps-uat.json --env staging --only MAPS_BACK_UAT`

`pm2 start pm2-maps-uat.json --env staging --only MAPS_BACK_UAT_WORKER1`

`pm2 start pm2-maps-uat.json --env staging --only MAPS_FRONT_UAT`

`pm2 start pm2-maps-uat.json --env staging --only OP_BACK_UAT`

`pm2 start pm2-maps-uat.json --env staging --only OP_FRONT_UAT`

**PROD BE**

`pm2 start pm2-maps-prod-BE.json --env production --only MAPS_BACK_PROD`

`pm2 start pm2-maps-prod-BE.json --env production --only MAPS_BACK_PROD_WORKER1`

`pm2 start pm2-maps-prod-BE.json --env production --only OP_BACK_PROD`

**PROD BE**

`pm2 start pm2-maps-prod-FE.json --env production --only MAPS_FRONT_PROD`

`pm2 start pm2-maps-prod-FE.json --env production --only OP_FRONT_PROD`
