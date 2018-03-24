const winston = require('winston');
// const loggly = require('winston-loggly-bulk');

export class Log {
  static logLevels = {
    error: 0,
    info: 1,
    debug1: 2,
    debug2: 3
  };

  static logColors = {
    error: 'red',
    info: 'yellow',
    debug1: 'blue',
    debug2: 'green'
  };

  static logger = new winston.Logger({
    levels: Log.logLevels,
    colors: Log.logColors,
    transports: [
      new winston.transports.Console({
        timestamp: true,
        level: 'debug',
        colorize: true
      }),
      new winston.transports.File({
        filename: 'errors.log',
        level: 'error'
      })
      // new winston.transports.Loggly({
      //     subdomain: 'epfromer',
      //     token: "5b6ea74c-ba58-4af5-95bc-7a4d2d6207be",
      //     tags: ["Winston-NodeJS"],
      //     json: true
      // })
    ]
  });

  static error(s: any) {
    Log.logger.error(s);
  }

  static info(s: any) {
    Log.logger.info(s);
  }

  static debug1(s: any) {
    Log.logger.debug1(s);
  }

  static debug2(s: any) {
    Log.logger.debug2(s);
  }

  static flushLogsAndExit() {
    // loggly.flushLogsAndExit();
  }
}
