import WebSocket from 'ws'
import _ from 'ramda'
import debug from 'debug'
import {EventEmitter} from 'events'

const log = debug('diesocketdie:socket')

class Connection extends EventEmitter {
  constructor(id) {
    super() // yuck
    this.id = id
  }

  connected() {
    return (this._ws !== null && this._ws.readyState === 1)
  }

  connect(address) {
    this._ws = new WebSocket(address);

    this._ws.onopen = () => {
      this.emit('connected')
    }

    this._ws.onclose = () => {
      this.emit('disconnected')
    }

    this._ws.onmessage = (f) => {
      this.emit('message', f)
    }

    this._ws.onerror = () => {
      this.emit('error', arguments)
    }
  }

  disconnect() {
    this._ws.close()
  }

  send(data) {
    if (this.connected()) {
      this._ws.send(JSON.stringify(data))
    }
  }
}

module.exports = Connection
