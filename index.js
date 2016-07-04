'use strict';


const config       = require(__dirname + '/config/config');
const mysql        = require('anytv-node-mysql');
const body_parser  = require('body-parser');
const winston      = require('winston');
const express      = require('express');

let app;
let handler;

function start () {
  if (handler) {
    handler.close();
  }

  // create express app
  app = express();

  // set config
  config.use(process.env.NODE_ENV);
  app.set('env', config.ENV);

  // configure logger
  winston.cli();
  winston.level = config.LOG_LEVEL || 'silly';

  // configure mysql
  mysql.set_logger(winston)
    .add('master', config.MASTER_DB, true)
    .add('slave', config.SLAVE_DB, true);

  winston.log('info', 'Starting', config.APP_NAME, 'on', config.ENV, 'environment');

  // configure express app
  app.set('case sensitive routing', true);
  app.set('x-powered-by', false);

  winston.log('verbose', 'Binding 3rd-party middlewares');
  app.use(require('method-override')());
  app.use(body_parser.urlencoded({extended: false}));
  app.use(body_parser.json());
  app.use(require('compression')());

  winston.log('verbose', 'Binding custom middlewares');
  app.use(require('anytv-node-cors')(config.CORS));
  app.use(require(__dirname + '/lib/res_extended')());
  app.use(require(__dirname + '/config/router')(express.Router()));
  app.use(require('anytv-node-error-handler')(winston));


  winston.log('info', 'Server listening on port', config.PORT);

  return app.listen(config.PORT);
}

handler = start();

module.exports = {
  app,
  start,
  handler
};