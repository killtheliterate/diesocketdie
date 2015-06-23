// vendor
import R from 'ramda'
import debug from 'debug'
import {EventEmitter} from 'events'

// lib
import Connection from './socket'

const log = debug('diesocketdie:make_connections')
const heartbeat = 25 * 1000
const sockets = []

let interval = void 0
let index = 0

function makeConnection (clients, address, vent) {
  return function () {
    index = index + 1

    let ws = new Connection(index)

    sockets.push(wrap(ws))

    ws.connect(address)

    if (index === clients) {
      clearInterval(interval)
      vent.emit('finished')
    }
  }
}

function wrap (ws) {
  return new Promise(function (resolve, reject) {
    ws.on('connected', function (f) {
      resolve(ws)
    })

    ws.on('error', function (f) {
      reject(ws)
    })
  })
}

function makeConnections (clients, address) {
  let vent = new EventEmitter()
  let connect = makeConnection(clients, address, vent)

  return new Promise(function(resolve, reject) {
    vent.on('finished', function() {
      resolve(Promise.all(sockets))
    })

    interval = setInterval(connect, heartbeat/clients)
  })
}

export default makeConnections
