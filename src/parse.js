import debug from 'debug'

const log = debug('diesocketdie:parse')

const parse = function(str) {
    // If you're like me, then your socket response is not JSON...
    try {
      return JSON.parse(str.slice(str.indexOf('{')));
    } catch (e) {
      log('protocol: unknown blob from socket: ', str);
      return null;
    }
}

export default parse
