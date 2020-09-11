// vendor
import * as oS from 'observable-socket'
import debug from 'debug'
import wS from 'ws'
import { EventEmitter } from 'events'

const log = debug('diesocketdie:make_connections')

export type Socket = ReturnType<typeof oS.create> & { _id?: number }

/**
 * `export initialize :: Integer -> (Integer -> String -> Promise [Observable])`
 */
export function initialize (heartbeat: number) {
    const sockets: Array<Socket>  = []
    const socketPromises: Array<Promise<any>> = []

    function makeConnection (vent: EventEmitter, clientCount: number, address: string) {
        if (clientCount === 0) {
            vent.emit('finished')
        } else {
            const ws = new wS(address)
            ws.setMaxListeners(100) // quiet event listener warning

            const os: ReturnType<typeof oS.create> & { _id?: number } = oS.create(ws)

            os._id = clientCount // give the stream a label

            sockets.push(os)

            socketPromises.push(new Promise((resolve) => {
                ws.on('open', resolve)
            }))

            setTimeout(() => makeConnection(vent, clientCount - 1, address), heartbeat)
        }
    }

    return function makeConnections (clientCount: number, address: string) {
        const vent = new EventEmitter()

        return new Promise<Array<Socket>>(function (resolve, reject) {
            vent.on('finished', function () {
                log('finished')

                Promise.all(socketPromises)
                    .then(() => resolve(sockets))
                    .catch(reject)
            })

            makeConnection(vent, clientCount, address)
        })
    }
}
