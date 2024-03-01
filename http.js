// load configuration data
const loadbalancer = require('./routes/chooseServer');
const fs = (module.exports = require('graceful-fs'));
module.exports = require('https');
const express = (module.exports = require('express'));
require('./newrelic');
const { REDIS_HOST, REDIS_PWD } = require('./config')

const http = require('http');

const path = require('path');
const cors = require('cors');

// fs.unlinkSync("./log_file.log");
GAMELOGICCONFIG = module.exports = require('./gamelogic.json')
require('./database/mongoDbConnection');

const modelsPath = './models';
const dirents = fs.readdirSync(modelsPath, { withFileTypes: true });

const filesNames = dirents.filter((dirent) => dirent.isFile()).map((dirent) => dirent.name);

filesNames.forEach((file) => {
  if (file.endsWith('.js')) {
    require(`${modelsPath}/${file}`);
  }
});

const SERVER_ID = (module.exports = 'HTTPServer');
const SERVER_PORT = (module.exports = process.env.PORT || 3000);

const RDS_HOST = REDIS_HOST
const RDS_PWD = REDIS_PWD
const RDS_SELECT = 1
const redis = require('redis');
const fileUpload = require('express-fileupload');

(async () => {
  rClient = (module.exports = redis.createClient(6379, RDS_HOST));
  rClient.auth(RDS_PWD, function () { });
  rClient.select(1);
  // eslint-disable-next-line no-console
  rClient.on('error', (err) => console.log('Redis Client Error', err));

  rClient.on('connect', () => {
    console.log('Redis Client connected')
  });
})();

//const wallet = require('./controller/wallet');
const socket = require('./controller/socket-server');
// server start configuration here.
const httpApp = (module.exports = express());
// binding all configuratio to app

httpApp.use(express.json());
httpApp.use(
  cors({
    origin: '*',
    methods: 'GET,PUT,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Image Upload
// httpApp.use(
//   fileUpload({
//     limits: {
//       fileSize: 15 * 1024 * 1024,
//     },
//   })
// );

httpApp.use('/upload', express.static(path.join(__dirname, 'upload')));

// New Routes
const admin = require('./routes/admin');
const user = require('./routes/users');
const webhook = require('./routes/webhook');
const morgan = require('morgan');

const { initializeLogger, logger } = require('./newLogger');
const { Module } = require('module');

httpApp.use(morgan('combined'));

initializeLogger(httpApp);

httpApp.use('/chooseServer', loadbalancer);
httpApp.use('/admin', admin);
httpApp.use('/user', user);
//httpApp.use('/wallet', wallet);
httpApp.use('/webhook', webhook);

httpApp.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

httpApp.use(express.static(path.join(__dirname, 'public')));
httpApp.use('/reports', express.static(path.join(__dirname, 'reports')));

const server = http.createServer(httpApp);
server.listen(SERVER_PORT, () => {
  console.log('Server ID : => ' + SERVER_ID + ' - Express server listening on port : ' + SERVER_PORT + ' date : ' + new Date());
  socket.init(server);
});

process.on('unhandledRejection', (reason, p) => {
  logger.info(reason, ' > Unhandled Rejection at Promise: ', p);
});

process.on('uncaughtException', (err) => {
  logger.info(err, '< Uncaught Exception thrown');
});
