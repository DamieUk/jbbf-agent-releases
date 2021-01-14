import log from 'electron-log';

log.info(`Logs are placed in "${log.transports.file.file}"`);

export default log;
