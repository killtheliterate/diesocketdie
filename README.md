# Die, Socket, Die
Stress test a websocket, bruh.

## Doing Stuff
This requires a handful of modifications before running:
* add the appropriate JSON formatted data to `/fixture`
* modify /* REPLACE */ with the appropriate responses
* look at the parse function, decide if you need it (you don't if you're consuming JSON)
* stuff like that... i'll make this better sometime

I read some blog words [here](http://bocoup.com/weblog/node-stress-test-procedure/), which why I made this 'lil repo.

Run
```bash
$ node --address 'ws://A_WEBSOCKET' --clientcount 25
```

Run with output
```bash
$ DEBUG=diesocketdie:* node --address 'ws://A_WEBSOCKET' --clientcount 25
```
