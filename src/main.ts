import debug from 'debug'
import path from 'path'
import repl from 'repl'
import yargs from 'yargs'
import { map } from 'ramda'
import { merge } from 'rxjs'

// ---------------------------------------------------------------------------

import {
    Socket,
    initialize
} from './make_connections'

// ---------------------------------------------------------------------------

const __version = require('../package').version

const log = debug('diesocketdie:index')

const argv = yargs
    .alias('v', 'version')
    .version(__version)
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

const clientCount = argv.cc || 1
const heartbeat = argv.hb ? argv.hb / clientCount : 0
const pingInterval = argv.pi || 3 * 1000
const pingMessage = argv.pm || JSON.stringify({ PING: true })
const reconnectInterval = argv.ri || 30 * 1000

function send (sockets: Socket[]) {
    return function (msg: any) {
        const sends = map(function (socket: Socket) {
            socket.up(JSON.stringify(msg))
        })

        sends(sockets)
    }
}

function sendFile (sockets: Socket[]) {
    return function (filePath: string) {
        const data = require(path.resolve(process.cwd(), filePath))

        send(sockets)(data)
    }
}

const debugSub = map(function (socket: Socket) {
    socket.down.subscribe(
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

function setUp (sockets: Socket[]) {
    process.stdout.write(`Connected to ${argv.ad}\n`)

    if (argv.i) {
        const replServer = repl.start({
            prompt: 'diesocketdie> ',
        })

        replServer.context.send = send(sockets)
        replServer.context.sendFile = sendFile(sockets)
    }

    if (argv.p) {
        map(os => setInterval(() => os.up(pingMessage), pingInterval), sockets)
    }

    return sockets
}

function _merge (sockets: Socket[]) {
    merge(...map(el => el.down, sockets))
        .subscribe(
            function onNext (msg) {
                if (argv.w) {
                    process.stdout.write(`Heard: ${JSON.stringify(msg.data, null, 2)}\n`)
                }
            },

            function onError () {
                process.stderr.write(`Error: reconnecting in ${reconnectInterval / 1000} seconds\n`)

                setTimeout(main, reconnectInterval)
            },

            function onComplete () {
                process.stdout.write(`Complete: reconnecting in ${reconnectInterval / 1000} seconds\n`)

                setTimeout(main, reconnectInterval)
            }
    )

    return sockets
}

export function main () {
    process.stdout.write(`Just... Yup, about to crush/stomp ${argv.ad} with ${clientCount} connections! \n`)

    initialize(heartbeat)(clientCount, argv.ad)
        .then(setUp)
        .then(debugSub)
        .then(_merge)
        .catch(function (err) {
            process.stderr.write(`No good... ${err}\n`)

            process.exit()
        })
}
