var exec = require('child_process').exec

function md5File(filePath, cb){
  exec(`md5 -q "${filePath}"`, cb)
}

module.exports = md5File
