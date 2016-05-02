const exec = require('child_process').exec
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

module.exports = xmlInfo
