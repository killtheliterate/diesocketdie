#!/usr/bin/env node
require('babel/register')

// vendor
var argv = require('yargs').argv
var assign = require('lodash/object/assign')
var log = require('debug')('diesocketdie:index')

// lib
var connect = require('./src/make_connections')
var fixture = require('./fixture/messages')
var parse = require('./src/parse')
var sendMessages = require('./src/send_messages')

log('Five... Four... uh, Five... Five... NOW NOW NOW NOW NOW NOW')

var count = argv.clientcount
var address = argv.address
var connected = connect(count, address)

connected.then(function(sockets) {
  log('There are %s sockets connected', sockets.length)

  sockets.map(function(ws) {
    ws.on('message', function(msg) {
      log('heard', parse(msg.data))
    })
  })
})

// log in, subscribe, on and on
var loggedIn = sendMessages(connected, /* REPLACE */)
var subscribed = sendMessages(loggedIn, /* REPLACE */)

// ETC ETC ETC
