const express = require('express');
const app = express();
const http = require('http');
const socket = require('./controller/socket-server');
const path = require('path');
const redis = require('redis');
const logger = require('./logger');

const SERVER_PORT = process.argv[2];
const SERVER_ID = process.argv[3];
const SERVICE_HOST = process.argv[4];

logger.info('SERVER_PORT', SERVER_PORT + ' \nSERVER_ID', SERVER_ID + ' \nSERVICE_HOST', SERVICE_HOST);
// (async () => {
//   const rClient = redis.createClient();
//   rClient.on('error', (err) => logger.info('Redis Client Error', err));
//   rClient.on('connect', () => {
//     logger.info('Redis Client connected');
//     rClient.hmset(SERVER_ID, 'host', SERVICE_HOST, 'port', SERVER_PORT, 'proto', 'http');
//   });
// })();

const PORT = SERVER_PORT || 2828;
const server = http.createServer(app);
// logger.info("Index Server Started : " + JSON.stringify(server));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'reports')));

server.listen(PORT, () => {
  logger.info(`Server Started : ${PORT}`);
  socket.init(server);
});
