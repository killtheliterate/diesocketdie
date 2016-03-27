// vendor
// import debug from 'debug'

import { Server } from 'ws'

export default function createPublishServer (port) {
    var server = new Server({port: port})

    server.on('connection', function (socket) {
        const send = function (msg) {
            socket.send(JSON.stringify(msg))
        }

        const receive = function (msg) {
            return JSON.parse(msg)
        }

        // initial connection
        send({OPEN: 'success'})

        socket.on('message', function (msg) {
            const message = receive(msg)

            if (message.PING) {
                send({PONG: 'heard ping'})
            }

            if (message.POISON) {
                server.close()
            }
        })
    })

    return server
}
