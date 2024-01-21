/* eslint-disable no-unused-vars */
const morgan = require('morgan');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

morgan.token('id', function (req) {
  return req.id;
});

const MASK = ['pwd', 'password', 'repeatPassword'];

const maskParameters = (body) => {
  const data = { ...body };
  for (const [key, value] of Object.entries(data)) {
    if (MASK.includes(key)) {
      data[key] = '***';
    }
  }
  return data;
};

const coloredOutput = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf((info) => {
    const { level, message, ...args } = info;

    return `{"level": "${level}", "message": "${message}", "data":  ${JSON.stringify(
      { ...args }
    )} }`;
  })
);

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: coloredOutput,
    }),
  ],
});

const logRequest = (app) => {
  app.use(function (req, res, next) {
    // eslint-disable-next-line no-param-reassign
    req.id = uuidv4();
    const body = maskParameters(req.body);

    logger.info('Request:', {
      requestId: req.id,
      requestMethod: req.method,
      requestUrl: req.url,
      'Query:': req.query,
      'Body:': body,
    });

    next();
  });
};

const logMorgan = (app) => {
  app.use(
    morgan(
      ':id :remote-addr :method :url :status :response-time ms - :res[content-length]',
      {
        stream: {
          write: (text) => {
            logger.info(`Request finished: ${text}`);
          },
        },
        skip: function (req, res) {
          // TODO
          if (req.url.includes('')) {
            return true;
          } else {
            return false;
          }
        },
      }
    )
  );
};

const logRequestVariables = (requestId, variables) => {
  logger.info('Variables: ', {
    requestId,
    ...variables,
  });
};

const logRequestMessage = (requestId, message, level = 'info', data = {}) => {
  logger.log(level, message, { requestId, ...data });
};

const initializeLogger = (app) => {
  logMorgan(app);
  logRequest(app);
};

module.exports = {
  logger,
  logRequestVariables,
  logRequestMessage,
  initializeLogger,
};
