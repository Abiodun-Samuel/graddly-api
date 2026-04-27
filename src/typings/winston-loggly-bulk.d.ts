declare module 'winston-loggly-bulk' {
  import Logform from 'logform';
  import TransportStream from 'winston-transport';

  interface ILogglyOptions extends TransportStream.TransportStreamOptions {
    format?: Logform.Format;
    token: string;
    subdomain: string;
    tags?: string[];
    json?: boolean;
    host?: string;
    auth?: { username: string; password: string };
    networkErrorsOnConsole?: boolean;
    isBulk?: boolean;
    bufferOptions?: { size: number; retriesInMilliseconds: number };
    timestamp?: boolean;
    stripColors?: boolean;
  }

  class Loggly extends TransportStream {
    constructor(options: ILogglyOptions);
  }

  export { Loggly };
}
