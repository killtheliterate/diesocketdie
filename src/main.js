// vendor
import debug from 'debug'
import path from 'path'
import repl from 'repl'
import yargs from 'yargs'
import { Rx } from 'rx'
import { map } from 'ramda'

// lib
import makeConnections from './make_connections'

const log = debug('diesocketdie:index')

const argv = yargs
    .alias('v', 'version')
    .version(() => require('../package').version)
    .alias('h', 'help')
    .help('help')
    .usage('Usage: $0 --ad [string] --cc [number] -pwi')
    .options({
        'ad': {
            demand: true,
            alias: 'address',
            describe: 'websocket address',
            type: 'string',
        },
        'cc': {
            alias: 'clientcount',
            describe: 'websocket client count',
            type: 'number',
        },
        'hb': {
            alias: 'heartbeat',
            describe: 'connection spinup time',
            type: 'number',
        },
        'pi': {
            alias: 'pinginterval',
            describe: 'ping interval',
            type: 'number',
        },
        'pm': {
            alias: 'pingmessage',
            describe: 'ping message',
            type: 'string',
        },
        'ri': {
            alias: 'reconnectinterval',
            describe: 'reconnection interval',
            type: 'number',
        },
    })
    .options({
        'p': {
            alias: 'ping',
            describe: 'ping',
            type: 'boolean',
        },
        'w': {
            alias: 'writeout',
            describe: 'write to stdout',
            type: 'boolean',
        },
        'i': {
            alias: 'interactive',
            describe: 'start REPL',
            type: 'boolean',
        },
    })
    .argv

const clientCount = argv.clientcount || 1
const heartbeat = argv.heartbeat ? argv.heartbeat / clientCount : 0
const pingInterval = argv.pinginterval || 3 * 1000
const pingMessage = argv.pingmessage || JSON.stringify({PING: true})
const reconnectInterval = argv.reconnectinterval || 30 * 1000

function send (os) {
    return function (msg) {
        const sends = map(function (socket) {
            socket.send(JSON.stringify(msg))
        })

        sends(os)
    }
}

function sendFile (os) {
    return function (filePath) {
        const data = require(path.resolve(process.cwd(), filePath))

        send(os)(data)
    }
}

const debugSub = map(function (socket) {
    socket.observable.subscribe(
        function onNext (message) {
            log(`${socket._id}: MESSAGE`, message)
        },

        function onError (err) {
            log(`${socket._id}: ERROR`, err)
        },

        function onComplete () {
            log(`${socket._id}: COMPLETE`)
        }

    )

    return socket
})

function setUp (os) {
    process.stdout.write(`Connected to ${argv.address}`)

    if (argv.interactive) {
        const replServer = repl.start({
            prompt: 'diesocketdie> ',
        })

        replServer.context.send = send(os)
        replServer.context.sendFile = sendFile(os)
    }

    if (argv.ping) {
        map(os => setInterval(() => os.send(pingMessage), pingInterval), os)
    }

    return os
}

function merge (os) {
    Rx.Observable
        .merge(map(el => el.observable, os))
        .subscribe(
            function onNext (msg) {
                if (argv.writeout) {
                    process.stdout.write(msg)
                }
            },

            function onError () {
                process.stderr.write(`Error: reconnecting in ${reconnectInterval / 1000} seconds`)

                setTimeout(main, reconnectInterval)
            },

            function onComplete () {
                process.stdout.write(`Complete: reconnecting in ${reconnectInterval / 1000} seconds`)

                setTimeout(main, reconnectInterval)
            }
    )

    return os
}

function main () {
    process.stdout.write(`Just... Yup, about to crush/stomp ${argv.address} with ${clientCount} connections!`)

    makeConnections(heartbeat)(clientCount, argv.address)
        .then(setUp)
        .then(debugSub)
        .then(merge)
        .catch(function (err) {
            process.stderr.write(`${err}`)

            process.exit()
        })
}

export default main
