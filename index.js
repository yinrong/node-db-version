module.exports.apply = function(p, callback) {
  if (!p.onExecuted) p.onExecuted = function(){}
  var sqls, db = p.connection, old_n
  var outinfo = {
    n_executed: 0,
  }
  async.waterfall([
  function(next) {
    fs.readFile(p.filename, next)
  },
  function(txt, next) {

    sqls = txt.toString()
      .split('\n')
      .filter(function(line) {
        line = line.replace(/^ +/, '')
        line = line.replace(/ +$/, '')
        if (!line) return false
        if (line.match(/^#/)) return false
        return true
      })
      .join(' ')
      .replace(/  +/g, ' ')
      .split(';')
      .filter(function(sql) {
        return sql
      })
    db.query('create table if not exists `__SCHEMA__` (n int)', next)
  },
  function(rows, info, next) {
    db.query('select n from `__SCHEMA__`', next)
  },
  function(rows, info, next) {
    if (rows.length > 0) {
      old_n = rows[0].n
      return next(null, null, null)
    }
    old_n = 0
    db.query('insert into `__SCHEMA__` (n) values (0)', next)
  },
  function(rows, info, next) {

    async.eachSeries(sqls.slice(old_n), function(sql, nextSql) {

      async.waterfall([
      function(next1) {
        db.query(sql, next1)
      },
      function(rows, info, next1) {
        db.query('update `__SCHEMA__` set n = n + 1', next1)
      },
      function(rows, info, next1) {
        outinfo.n_executed++
        p.onExecuted({sql: sql})
        next1()
      },
      ], nextSql)

    }, next) // end eachSeries

  },
  function(next) {
    callback(null, outinfo)
  },
  ], callback)
}

const async = require('async')
const fs = require('fs')
