'use strict'
var fs = require('fs')
var csp = require('js-csp')
var _ = require('lodash')
var md5FileFn = require('./md5')
var colors = require('colors')
var path = require('path')

var chanelify = require('./chanelify')
var md5File = chanelify(md5FileFn)
let stat = chanelify(fs.lstat)
let readdir = chanelify(fs.readdir)

var go = csp.go
var chan = csp.chan
var take = csp.take
var put = csp.put
var buffers = csp.buffers
var alts = csp.alts
var putAsync = csp.putAsync

let filesFoundCh = chan(1)
let filesCh = chan(1)
let dirsCh = chan(2048)

process.on('beforeExit', () => console.log(('files found: ' + filesFound).blue))

let filesFound = 0

let loggerGen = function *(){
  while(true) {
    let f = yield take(filesCh)
    let a = yield md5File(f.path)
    let b = new Buffer(a.trim(), 'hex')
    let str = b.toString('base64').replace(/\//g, '_')
    let filesize = f.stats.size
    filesFound++
    console.log(' <- ' + f.path + ' ' + filesize + ' ' + str)
  }
}

let fileStatGen = function *(){
  while(true) {
    let f = yield take(filesFoundCh)
    let s = yield take(stat(f.path))
    let ch = s.isDirectory() ? dirsCh : filesCh
    yield csp.timeout(50)
    yield put(ch, Object.assign({}, f, {stats: s}))
  }
}

let dirScanGen = function *(){
  while(true) {
    // console.log(('DirsInQueue: '+dirsCh.buf.count()).yellow)
    let d = yield take(dirsCh)
    console.log(('SCAN DIR ' + d.filename).yellow)
    let files = yield take(readdir(d.path))
    for (let f of files) {
      let file = { path: path.join(d.path, f), dir: d.path, filename: f, }
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
