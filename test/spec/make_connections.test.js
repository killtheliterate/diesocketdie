// vendor
import test from 'tape'

// lib
import { initialize as makeConnections } from './../../dist/make_connections'
import Server from  './../fixture/server'

function close (server, cb) {
    server.close(function () {
        cb()
    })
}

test('makeConnections', function (t) {

    t.test('makeConnections() return function', function (t) {
        t.plan(1)

        const connection = makeConnections()

        t.equal(typeof connection, 'function')
    })

    t.test('makeConnections()() return a Promise', function (t) {
        const server = Server(8086)
        const connection = makeConnections()(1, 'ws://localhost:8086')

        connection
            .then(function () {
                t.pass('Yes!')

                close(server, t.end)
            })
            .catch(function (err) {
                t.fail(err)

                close(server, t.end)
            })
    })

    t.test('makeConnections()() creates a client', function (t) {
        const server = Server(8086)
        const connection = makeConnections()(1, 'ws://localhost:8086')

        connection
            .then(function (sockets) {
                t.equal(sockets.length, 1)

                close(server, t.end)
            })
            .catch(function (err) {
                t.fail(err)

                close(server, t.end)
            })
    })

    t.test('makeConnections()() creates multiple clients', function (t) {
        const server = Server(8086)
        const connection = makeConnections()(10, 'ws://localhost:8086')

        connection
            .then(function (sockets) {
                t.equal(sockets.length, 10)

                close(server, t.end)
            })
            .catch(function (err) {
                t.fail(err)

                close(server, t.end)
            })
    })
})
