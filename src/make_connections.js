// vendor
// import debug from 'debug'
import oS from 'observable-socket'
import wS from 'ws'
import { EventEmitter } from 'events'

// const log = debug('diesocketdie:make_connections')

/**
 * `export default main :: Integer -> (Integer -> String -> Promise [Observable])`
 */
function main (heartbeat) {
    const sockets = []
    const socketPromises = []

    function makeConnection (vent, clientCount, address) {
        if (clientCount === 0) {
            vent.emit('finished')
        } else {
            const ws = new wS(address)
            ws.setMaxListeners(100) // quiet event listener warning

            const os = new oS(ws)

            os._id = clientCount // give the stream a label

            sockets.push(os)
            socketPromises.push(os.observable.first().toPromise())
            setTimeout(() => makeConnection(vent, clientCount - 1, address), heartbeat)
        }
    }

    return function makeConnections (clientCount, address) {
        const vent = new EventEmitter()

        return new Promise(function (resolve, reject) {
            vent.on('finished', function () {
                Promise.all(socketPromises)
                    .then(() => resolve(sockets))
                    .catch(reject)
            })

            makeConnection(vent, clientCount, address)
        })
    }
}

export default main
