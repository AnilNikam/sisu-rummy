const express = require('express');
const router = express.Router();
const logger = require('../logger');
const redis = require('redis');

router.get('/', function (req, res) {
  logger.info('====> chooseServer <====');
  // rClient.get("s1_1",(err,data)=>{
  //     logger.info("=====> err <===",err)
  //     logger.info("=====> data <===",data)
  // })
  chooseServer({}, function (json) {
    res.send(json);
  });
});

async function chooseServer(data, callback) {
  try {

    logger.info('Choose server API Called <====');
    logger.info(typeof rClient);
    const server_prefix = 's1_*'; //take from config
    rClient.keys(server_prefix, function (error, servers) {
      logger.error('====> error :: ', error);
      logger.info('====> servers :: ', servers);
      if (!servers.length) {
        callback([]);
        return;
      }
      let serverIndex = Math.floor(Math.random() * servers.length);
      logger.info('====> serverIndex <====', serverIndex);
      rClient.hgetall(servers[serverIndex], function (err, finalServer) {
        logger.error('== hgetall ==> err <====', err);
        logger.info('=hgetall ==> finalServer <====', finalServer);

        if (!err) callback(finalServer);
      });
    });
  } catch (error) {
    logger.error('webhook/chooseServer.js chooseServer error => ==>>', error);
  }
}

module.exports = router;
