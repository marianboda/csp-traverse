'use strict'
var fs = require('fs')
var csp = require('js-csp')

var go = csp.go
var chan = csp.chan
var take = csp.take
var put = csp.put

// var buffers = csp.buffers
// var alts = csp.alts
var putAsync = csp.putAsync

let dirsToProcessCh = chan(8)

let ch = chan(3)

go(function *(){
  while(true) {
    console.log(' <- ' + (yield take(dirsToProcessCh)))
  }
})


  fs.readdir('.', function (err, files) {
    console.log('sranda')
    go(function *(){
      for (let f of files) {
        console.log('+++',f)
        yield put(dirsToProcessCh, f)
      }
    })
  })

setTimeout(() => console.log('done'), 4000)
