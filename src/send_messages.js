import debug from 'debug'
import R from 'ramda'
import assign from 'lodash/object/assign'
import parse from './parse'

const log = debug('diesocketdie:send_messages')

const sendMessage = R.curry(function sendMessage (msg, connection) {
  let transaction_id = (1e15 - (Math.random() * 1e14)).toString(36)

  connection.send(/* REPLACE */)

  return new Promise(function(resolve, reject) {
    connection.on('message', function(msg) {
      let data = parse(msg.data)

      if (/* REPLACE */) {
        resolve(connection)
      }
    })
  })
})

const sendMessages = function sendMessages (liftedConnections, message) {
  const send = sendMessage(message)

  return liftedConnections.then(function(connections) {
      return Promise.all(R.map(send, connections))
  })
}

export default sendMessages
