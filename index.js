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

let coner = (err) => console.error(err)
let filesFoundCh = chan(1, undefined, coner)
let filesCh = chan(1, undefined, coner)
let dirsCh = chan(2048, undefined, coner)

process.on('beforeExit', () => console.log(('files found: ' + filesFound).blue))


let stat = chanelify(fs.lstat)
let readdir = chanelify(fs.readdir)

let filesFound = 0

let loggerGen = function *(){
  while(true) {
    let f = yield take(filesCh)
    filesFound++
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
  }
}

let dirScanGen = function *(){
  while(true) {
    // console.log(('DirsInQueue: '+dirsCh.buf.count()).yellow)
    // if (dirsCh.buf.count() == 0)
    //   break;
    let d = yield take(dirsCh)
    console.log(('SCAN DIR ' + d.filename).yellow)
    let files = yield take(readdir(d.path))
    for (let f of files) {
      let file = { path: path.join(d.path, f), dir: d.path, filename: f, }
      console.log(' + ',f)
      yield put(filesFoundCh, file)
    }
  }
  console.log("dirScanGen exited")
}


let scanPath = path.join(process.env.HOME, 'temp')
putAsync(dirsCh, { path: scanPath, dir: path.dirname(scanPath), filename: path.basename(scanPath), })

go(loggerGen)
go(fileStatGen)
go(dirScanGen)


// setTimeout(() => console.log('7 secs passed'), 7000)
