const exec = require('child_process').exec
const _ = require('lodash')
const xml2js = require('xml2js')
const xmlParse = xml2js.parseString

function xmlInfo(filePath, cb){
  exec(`mediainfo --Output=XML ${filePath}`, (err, res) => {
    if (err) cb(err)
    let xml = xmlParse(res, (err, xmlRes) => {
      if (err) cb(err)
      let tracks = xmlRes.Mediainfo.File[0].track
      let ob = tracks.reduce((acc, el) => {
        let type = el.$.type
        if (!acc.hasOwnProperty(type))
          acc[type] = []
        acc[type].push(el)
        return acc
      }, {})
      cb(null, ob)
    })
  })
}

function minfo(filePath, cb){
  exec(`mediainfo ${filePath}`, (err, res) => {
    if (err) return cb(err)

    let sections = res.split("\n\n")
    let mediaObject = sections.map((i) => {
      let lines = i.split("\n")
      let title = _.head(lines)
      let itemLines = _.tail(lines)
      let items = itemLines.map(j => {
        let item = j.split(':').map(str => str.trim())
        return [_.head(item), _.tail(item).join(':')]
      }).reduce((acc, el) => {
        let newOb = {}
        newOb[el[0]] = el[1]
        return Object.assign({}, acc, newOb)
      }, {})
      return [title, items]
    }).reduce((acc, el) => {
      if (el[0] == '' || el[1] == '')
        return acc
      let newOb = {}
      newOb[el[0]] = el[1]
      return Object.assign({}, acc, newOb)
    }, {})
    return cb(null, res)
  })
}

module.exports = xmlInfo
