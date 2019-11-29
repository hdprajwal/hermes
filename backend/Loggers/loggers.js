const {createLogger,format,transports} = require('winston');
const {combine,timestamp,printf,colorize} = format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp}@${level}: ${message}`;
  });
  
  const serverLog = createLogger({
    format: combine(timestamp(),colorize({level:true,colors:{error:'red',warn:'yellow',info:'blue'}}),logFormat),
    transports:[new transports.Console(),new transports.File({filename:'./logs/server.log'})]
  });
  
  const dbLog = createLogger({
    format: combine(timestamp(),logFormat),
    transports:[new transports.File({filename:'./logs/db.log'})]
  });

 module.exports = {serverLog,dbLog}; 