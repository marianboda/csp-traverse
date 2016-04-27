'use strict'
var fs = require('fs')
var csp = require('js-csp')

var go = csp.go
var chan = csp.chan
var take = csp.take
var put = csp.put

var buffers = csp.buffers
var alts = csp.alts
var putAsync = csp.putAsync

let filesFoundCh = chan(20)
let filesCh = chan()
let dirsCh = chan()

let loggerGen = function *(){
  while(true) {
    yield csp.timeout(250)
    let f = yield take(filesCh)
    console.log(' <- ' + f.dir + ' / ' + f.filename + ' ' + f.stats.size)
  }
}

let fileStatGen = function *(){
  while(true) {
    let f = yield(filesFoundCh)
    fs.lstat(f.path, (err, res) => {
      let ch = res.isDirectory() ? dirsCh : filesCh
      putAsync(ch, Object.assign({}, f, {stats: res}))
    })
  }
}

let dirScanGen = function *(){
  while(true) {
    let d = yield dirsCh
    console.log('DIR ' + d.filename)
  }
}

function scanDir(path) {
  fs.readdir(path, (err, files) => {
    console.log('rdHandler')
    go(function *(){
      console.log('in goroutine')
      for (let f of files) {
        let file = { path: path+'/'+f, dir: path, filename: f, }
        console.log('+++',f)
        yield put(filesFoundCh, file)
      }
    })
  })
}

go(loggerGen)
go(fileStatGen)
go(dirScanGen)
scanDir(process.env.HOME)
setTimeout(() => console.log('4 secs passed'), 4000)
