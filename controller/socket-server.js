const server = require('https').createServer();
const schedule = require('node-schedule');

// eslint-disable-next-line no-undef
io = module.exports = require('socket.io')(server, { allowEIO3: true });

const logger = (module.exports = require('../logger'));
const CONST = require('../constant');
const mainCtrl = require('./mainController');
const gamePlayActions = require('../helper/rummy');
const signupActions = require('../helper/signups');
const commonHelper = require('../helper/commonHelper');
const dealGamePlayActions = require('../helper/deal-rummy');
const poolGamePlayActions = require('../helper/pool-rummy');
const { sendEvent, sendDirectEvent } = require('../helper/socketFunctions');
const { getPaymentHistory, updateWallet } = require('../helper/walletFunction');
const { registerUser, addBankAccount } = require('../helper/signups/signupValidation');
const { userReconnect, takeSeat } = require('../helper/common-function/reConnectFunction');
const paymentAction = require('./paymentController,js');
const { PayOutTransfer } = require('./paymentController,js');
const { checkPayoutStatus } = require('./paymentController,js');
const { checkReferral, activePlayerCounter } = require('../helper/signups/appStart');

const walletActions = require('../helper/common-function/walletTrackTransaction');

const myIo = {};
const users = new Map();
const socketsers = new Map();

// create a init function for initlize the socket object
myIo.init = function (server) {
  // attach server with socket
  // eslint-disable-next-line no-undef
  io.attach(server);

  // eslint-disable-next-line no-undef
  io.on('connection', async (socket) => {
    try {
      // logger.info("Socket connected ===> ", socket.id);
      sendEvent(socket, CONST.DONE, {});

      socket.on('req', async (data) => {
        const decryptObj = commonHelper.decrypt(data.payload);
        const payload = JSON.parse(decryptObj);

        switch (payload.eventName) {

          case CONST.CHECK_KYC_ADHARA_NUMBER: {
            try {
              await signupActions.OKYCRequest(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js CHECK_KYC_ADHARA_NUMBER Number User error => ', error);
            }
            break;
          }

          case CONST.VERIFY_KYC_ADHARA_NUMBER: {
            try {
              await signupActions.OKYCverifyRequest(payload.data, socket);

            } catch (error) {
              logger.error('socketServer.js CHECK_KYC_ADHARA_NUMBER Number User error => ', error);
            }
            break;
          }

          case CONST.VERIFY_KYC_PAN_CARD: {
            try {
              await signupActions.OKYCPanverifyRequest(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js CHECK_KYC_ADHARA_NUMBER Number User error => ', error);
            }
            break;
          }

          case CONST.CHECK_MOBILE_NUMBER: {
            try {
              await signupActions.checkMobileNumber(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js check Mobile Number User error => ', error);
            }
            break;
          }

          case CONST.REGISTER_USER: {
            try {
              await registerUser(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js Register User Table error => ', error);
            }
            break;
          }

          case CONST.ADD_BANK_ACCOUNT: {
            try {
              logger.info("bank account payload.data ", payload.data)
              await addBankAccount(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js Register User Table error => ', error);
            }
            break;
          }

          case CONST.SEND_OTP: {
            try {
              let result = await mainCtrl.sendOTP(payload.data);
              sendEvent(socket, CONST.SEND_OTP, result);
            } catch (error) {
              logger.error('socketServer.js Send Otp error => ', error);
            }
            break;
          }

          case CONST.VERIFY_OTP: {
            try {
              const result = await mainCtrl.verifyOTP(payload.data);
              if (result.status) {
                sendEvent(socket, CONST.VERIFY_OTP, result.data);
                if (payload.data.otpType === 'VERIFY_NUMBER_FOR_LOGIN') {
                  await signupActions.userLogin(payload.data, socket);
                } else if (payload.data.otpType === 'EDIT_MOBILE_NUMBER') {
                  await signupActions.updateMobileNumber(payload.data, socket);
                }
              } else {
                sendEvent(socket, CONST.VERIFY_OTP, { verified: false });
              }
            } catch (error) {
              logger.error('socketServer.js Verify Otp error => ', error);
            }
            break;
          }

          case CONST.LOGIN: {
            try {
              signupActions.userLogin(payload.data, socket);
            } catch (e) {
              logger.info('Exception userLogin :', e);
            }
            break;
          }

          case CONST.DASHBOARD: {
            try {
              await signupActions.appLunchDetail(payload.data, socket);
            } catch (e) {
              logger.info('CONST.DASHBOARD Exception appLunchDetail :', e);
            }
            break;
          }

          case CONST.GET_BET_LIST: {
            try {
              await gamePlayActions.getBetList(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js GET_BET_LIST error => ', error);
            }
            break;
          }

          case CONST.POOL_GET_BET_LIST: {
            try {
              await gamePlayActions.poolBetList(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js GET_BET_LIST error => ', error);
            }
            break;
          }

          case CONST.DEAL_BET_LIST: {
            try {
              await gamePlayActions.dealBetList(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js GET_BET_LIST error => ', error);
            }
            break;
          }

          case CONST.JOIN_SIGN_UP: {
            try {
              socket.uid = payload.data.playerId;
              socket.sck = socket.id;

              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.joinTable(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.joinTable(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.joinTable(payload.data, socket);
                  break;
              }
            } catch (error) {
              logger.error('socketServer.js JOIN_SIGN_UP error => ', error);
              sendEvent(socket, CONST.ERROR, error);
            }
            break;
          }

          case CONST.FORGOT_PASWORD: {
            const newData = {
              number: payload.data.number,
              password: payload.data.password,
            };

            try {
              const res = await mainCtrl.forgotPassword(newData);
              logger.info('forgot Password Res => ', res);
              if (res.status === 1) {
                const finalData = { ...res.data, status: true };
                logger.info('uuupdate Password --> ', finalData);

                sendEvent(socket, CONST.FORGOT_PASWORD, finalData);
              } else {
                sendEvent(socket, CONST.FORGOT_PASWORD, {
                  status: false,
                  message: res.message,
                });
              }
            } catch (err) {
              logger.error('joinTable.js FORGOT_PASWORD error=> ', err);
            }
            break;
          }

          case CONST.CHANGE_PASWORD: {
            const newData = {
              playerId: payload.data.playerId,
              password: payload.data.oldPassword,
              newPassword: payload.data.newPassword,
            };
            try {
              const res = await mainCtrl.changePassword(newData);
              sendEvent(socket, CONST.CHANGE_PASWORD, res);
            } catch (err) {
              logger.error('joinTable.js CHANGE_PASWORD error=> ', err);
            }
            break;
          }

          case CONST.PING: {

            let res = await activePlayerCounter(socket)
            sendEvent(socket, CONST.PONG, res);
            break;
          }

          case CONST.PICK_CARD: {
            try {
              switch (payload.data.gamePlayType) {
                // POINT RUMMY
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.pickCard(payload.data, socket);
                  break;

                // POOL_RUMMY
                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.pickCard(payload.data, socket);
                  break;

                //DEAL_RUMMY
                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.pickCard(payload.data, socket);
                  break;

              }
            } catch (error) {
              logger.error('socketServer.js PICK_CARD error => ', error);
            }
            break;
          }

          case CONST.DISCARD: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.disCard(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.disCard(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.disCard(payload.data, socket);
                  break;


              }
            } catch (error) {
              logger.error('Disk card Card error => ', error);
            }
            break;
          }

          case CONST.CARD_GROUP: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.cardGroup(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.cardGroup(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.cardGroup(payload.data, socket);
                  break;


              }
            } catch (error) {
              logger.error('socketServer.js Group Card error => ', error);
            }
            break;
          }

          case CONST.DECLARE: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.declare(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.declare(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.declare(payload.data, socket);
                  break;


              }
            } catch (error) {
              logger.error('socketServer.js Declare Table error => ', error);
            }
            break;
          }

          case CONST.DROPPED: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.playerDrop(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.playerDrop(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.playerDrop(payload.data, socket);
                  break;


              }
            } catch (error) {
              console.log('DROP Table error => ', error);
            }

            break;
          }

          case CONST.PLAYER_FINISH_DECLARE_TIMER: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.playerFinishDeclare(payload.data, socket);

                  break;
                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.playerFinishDeclare(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.playerFinishDeclare(payload.data, socket);
                  break;

              }
            } catch (error) {
              logger.error('CONST.PLAYER_FINISH_DECLARE_TIMER:', error);
            }
            break;
          }

          case CONST.FINISH: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.playerFinish(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.playerFinish(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.playerFinish(payload.data, socket);
                  break;

              }
            } catch (error) {
              logger.error('Finsih Table error => ', error);
            }
            break;
          }

          case CONST.LEAVE: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.leaveTable(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.leaveTable(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.leaveTable(payload.data, socket);
                  break;

              }
            } catch (error) {
              logger.error('socketServer.js LEAVE Table error => ', error);
            }
            break;
          }

          case CONST.SWITCH_TABLE: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POINT_RUMMY:
                  await gamePlayActions.playerSwitch(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.playerSwitch(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.playerSwitch(payload.data, socket);
                  break;

              }
            } catch (error) {
              logger.info('Switch Table error => ', error);
            }
            break;
          }

          case CONST.RESTART_GAME_TABLE: {
            try {
              switch (payload.data.gamePlayType) {
                case CONST.GAME_TYPE.POOL_RUMMY:
                  await poolGamePlayActions.removePlayer(payload.data, socket);
                  break;

                case CONST.GAME_TYPE.DEAL_RUMMY:
                  await dealGamePlayActions.removePlayer(payload.data, socket);
                  break;
              }
            } catch (error) {
              logger.error('socketServer.js RESTART_GAME_TABLE Table error => ', error);
            }
            break;
          }

          case CONST.GAME_REPORT_PROBLEM: {
            try {
              const details = await mainCtrl.registerProblemReport(payload.data);

              if (details.status === 1) {
                sendDirectEvent(socket.id, CONST.GAME_REPORT_PROBLEM, { msg: 'Your report was submitted' });
              } else {
                sendDirectEvent(socket.id, CONST.GAME_REPORT_PROBLEM, { msg: 'Failed' });
              }
            } catch (error) {
              logger.info('Switch Table error => ', error);
            }
            break;
          }

          case CONST.SEND_MESSAGE_TO_TABLE: {
            try {
              await gamePlayActions.chatPanel(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js SEND_MESSAGE_TO_TABLE => ', error);
            }
            break;
          }

          case CONST.USER_PROFILE_DETAILS: {
            try {
              const newData = { playerId: payload.data.playerId };
              const res = await mainCtrl.playerDetails(newData);
              logger.info('USER_PROFILE_DETAILS result -->', res);

              sendEvent(socket, CONST.USER_PROFILE_DETAILS, res);
            } catch (error) {
              logger.error('socketServer.js USER_PROFILE_DETAILS error => ', error);
            }
            break;
          }

          case CONST.GET_BANK_DETAILS: {
            try {
              let res = await mainCtrl.getBankDetailByUserId(payload.data, socket);
              sendEvent(socket, CONST.GET_BANK_DETAILS, res.data);

            } catch (error) {
              logger.error('socketServer.js GET_BANK_DETAILS => ', error);
            }
            break;
          }

          case CONST.WALLET_TRANSACTION_HISTORY: {
            try {
              let res = await mainCtrl.getTransactiobDetailByUserId(payload.data, socket);
              sendEvent(socket, CONST.WALLET_TRANSACTION_HISTORY, res.data);

            } catch (error) {
              logger.error('socketServer.js GET_BANK_DETAILS => ', error);
            }
            break;
          }

          case CONST.OPEN_CHAT_PANEL: {
            try {
              await gamePlayActions.openChatPanel(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js SEND_MESSAGE_TO_TABLE => ', error);
            }
            break;
          }

          case CONST.WALLET_TRANSACTION_HISTORY: {
            try {
              const res = await mainCtrl.transactionHistory(newData);
              logger.info("Result ->", res);
              sendEvent(socket, CONST.WALLET_TRANSACTION_HISTORY, res);

            } catch (error) {
              logger.error('socketServer.js SEND_MESSAGE_TO_TABLE => ', error);
            }
            break;
          }

          case CONST.LEADER_BOARD: {
            try {
              const result = await mainCtrl.leaderBoard();

              sendEvent(socket, CONST.LEADER_BOARD, result);
            } catch (error) {
              logger.error('socketServer.js LEADER_BOARD => ', error);
            }
            break;
          }

          case CONST.LAST_POOL_POINT: {
            try {
              if (payload.data.gamePlayType === CONST.GAME_TYPE.POOL_RUMMY) {
                await poolGamePlayActions.lastPointTable(payload.data, socket);
              }
            } catch (error) {
              logger.error('socketServer.js LAST_POOL_POINT => ', error);
            }
            break;
          }

          case CONST.LAST_GAME_SCORE_BOARD: {
            try {
              await gamePlayActions.playerLastScoreBoard(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js LAST_GAME_SCORE_BOARD error => ', error);
            }
            break;
          }

          case CONST.RE_JOIN: {
            try {
              if (payload.data.gamePlayType === CONST.GAME_TYPE.POOL_RUMMY) {
                await poolGamePlayActions.reJoinUser(payload.data, socket);
              } else if (payload.data.gamePlayType === CONST.GAME_TYPE.DEAL_RUMMY) {
                await dealGamePlayActions.reJoinUser(payload.data, socket);
              }
            } catch (error) {
              logger.error('socketServer.js RE_JOIN error => ', error);
            }
            break;
          }

          case CONST.REMOVE_USERSOCKET_FROM_TABLE: {
            try {
              let { tableId } = payload.data;
              socket.leave(tableId.toString());
            } catch (error) {
              logger.error('socketServer.js RE_JOIN error => ', error);
            }
            break;
          }

          case CONST.LOGOUT: {
            try {
              const disconnectedUser = users.get(`${payload.data.playerId}`);

              const disconnectedUserSocket = socketToUsers.get(disconnectedUser);
              users.delete(disconnectedUser);
              users.delete(disconnectedUserSocket);

              socketToUsers.delete(disconnectedUserSocket);

              logger.info('LOGOUT JSON.stringify(users) => ', JSON.stringify(users) + 'LOGOUT JSON.stringify(socketToUsers) => ', JSON.stringify(socketToUsers));
            } catch (error) {
              logger.error('socketServer.js LOGOUT error => ', error);
            }
            break;
          }

          case CONST.PLAYER_BALANCE: {
            try {
              gamePlayActions.getWalletDetails(payload.data.playerId, socket);
            } catch (error) {
              logger.info('socketServer.js PLAYER_BALANCE error => ', error);
            }
            break;
          }

          case CONST.MYWALLET: {
            try {
              walletActions.getWalletDetailsNew(payload.data.playerId, socket);
            } catch (error) {
              logger.info('socketServer.js MYWALLET error => ', error);
            }
            break;
          }

          case CONST.PLAYER_PAYMENT_HISTORY: {
            try {
              const newData = await getPaymentHistory(payload.data, socket);
              sendDirectEvent(socket.id, CONST.PLAYER_PAYMENT_HISTORY, newData);
            } catch (error) {
              logger.error('socketServer.js PLAYER_PAYMENT_HISTORY error => ', error);
            }
            break;
          }

          case CONST.EXIT: {
            try {
              await gamePlayActions.disconnectTableHandle(socket);
            } catch (error) {
              logger.error('socketServer.js EXIT event error => ', error);
            }
            break;
          }

          case CONST.INAPP_PURCHASE_DONE: {
            try {
              let result = await updateWallet(payload.data);
              sendEvent(socket, CONST.INAPP_PURCHASE_DONE, result);
            } catch (error) {
              logger.error('socketServer.js GET_BET_LIST error => ', error);
            }
            break;
          }

          case CONST.TAKE_SEAT: {
            try {
              await takeSeat(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.jsTAKE_SEAT error => ', error);
            }
            break;
          }

          case CONST.RECONNECT: {
            try {
              logger.info('RE CONNECT Event Called ', payload.data, '\n<==== New Connected Socket id ===>', socket.id, '\n Table Id =>', socket.tbid);
              await userReconnect(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js RECONNECT => ', error);
            }
            break;
          }

          case CONST.CHECK_REFERAL_CODE: {
            try {
              logger.info('RE CONNECT Event Called REFFERAL ', payload.data);
              await checkReferral(payload.data, socket);
            } catch (error) {
              logger.error('socketServer.js REFFERAL => ', error);
            }
            break;
          }

          case CONST.PAY_IN: {
            try {
              console.log("PAY_IN ", payload.data)
              // await initiatePayment(payload.data, socket)
              await paymentAction.newInitiatePayment(payload.data, socket)
            } catch (error) {
              logger.error("Error in pay in ->", error)
            }
            break;
          }

          case CONST.CREATE_PAY_OUT: {
            try {
              await PayOutTransfer(payload.data, socket)

            } catch (error) {
              logger.error("Error in pay out ->", error)
            }
            break;
          }

          case CONST.CHECK_PAY_OUT_STATUS: {
            try {
              const res = await checkPayoutStatus(payload.data)
              sendEvent(socket, CONST.CHECK_PAY_OUT_STATUS, res)

            } catch (error) {
              logger.error("Error in pay out ->", error)
            }
            break;
          }

          default:
            sendEvent(socket, CONST.INVALID_EVENT, {
              msg: 'This Event Is Nothing',
            });
            break;
        }
      });

      /* Disconnect socket */
      socket.on('disconnect', async () => {
        try {
          logger.info('\n<==== disconnect socket id ===>', socket.id, '\n Disconnect Table Id =>', socket.tbid);

          const playerId = socket.uid;
          let jobId = CONST.DISCONNECT + playerId;
          logger.info('schedule USER Start DISCONNECTED jobId typeof : ', jobId, typeof jobId);

          //object player is disconnect or not

          let timerSet = Date.now() + 60000;
          //await setDelay(jobId, new Date(delay), 'disconnect');
          schedule.scheduleJob(jobId.toString(), timerSet, async function () {
            const result = schedule.cancelJob(jobId);

            logger.info('after USER JOB CANCELLED scheduleJob: ', result);
            await gamePlayActions.disconnectTableHandle(socket);
          });
        } catch (error) {
          logger.error('socketServer.js error when user disconnect => ', error);
        }
      });
    } catch (err) {
      logger.info('socketServer.js error => ', err);
    }
  });
};

module.exports = myIo;
