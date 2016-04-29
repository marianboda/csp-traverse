'use strict'
var fs = require('fs')
var csp = require('js-csp')
var _ = require('lodash')

var chanelify = require('./chanelify')
var go = csp.go
var chan = csp.chan
var take = csp.take
var put = csp.put

var buffers = csp.buffers
var alts = csp.alts
var putAsync = csp.putAsync
var colors = require('colors')
var path = require('path')

let filesFoundCh = chan()
let filesCh = chan()
let dirsCh = chan(2048)

let stat = chanelify(fs.lstat)
let readdir = chanelify(fs.readdir)

let loggerGen = function *(){
  while(true) {
    let f = yield take(filesCh)
    console.log(' <- ' + f.dir + ' / ' + f.filename + ' ' + f.stats.size)
  }
}

let fileStatGen = function *(){
  while(true) {
    let f = yield take(filesFoundCh)
    console.log(('taken ' + f.filename).green)
    let s = yield take(stat(f.path))
    let ch = s.isDirectory() ? dirsCh : filesCh
    yield csp.timeout(50)
    yield put(ch, Object.assign({}, f, {stats: s}))
    console.log(('stat put on channel. DirsInQueue: '+dirsCh.buf.count()).yellow)
  }
}

let dirScanGen = function *(){
  while(true) {
    let d = yield take(dirsCh)
    console.log(('SCAN DIR ' + d.filename).yellow)
    let files = yield take(readdir(d.path))
    for (let f of files) {
      let file = { path: path.join(d.path, f), dir: d.path, filename: f, }
      console.log(' + ',f)
      yield put(filesFoundCh, file)
    }
  }
}

go(loggerGen)
go(fileStatGen)
go(dirScanGen)

let scanPath = path.join(process.env.HOME, 'temp')
putAsync(dirsCh, { path: scanPath, dir: path.dirname(scanPath), filename: path.basename(scanPath), })

setTimeout(() => console.log('7 secs passed'), 7000)
