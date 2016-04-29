'use strict'
var _ = require('lodash')
var csp = require('js-csp')
var putAsync = csp.putAsync
var chan = csp.chan

function chanelify(fn) {
  if (!_.isFunction(fn))
    return null
  let ch = chan()
  let newF = function(){
    let cb = (err, res) => {
      if (err)
        return putAsync(ch, new Error(err))
      putAsync(ch, res)
    }
    let args = Array.prototype.slice.call(arguments)
    args.push(cb)
    fn.apply(null, args)
    return ch
  }
  return newF
}

module.exports = chanelify
