module.exports.apply = function(p, callback) {
  if (!p.onExecuted) p.onExecuted = function(){}
  var sqls, db = p.connection, old_n
  var basename = path.basename(p.filename)
  var outinfo = {
    n_executed: 0,
  }
  async.waterfall([
  function(next) {
    fs.readFile(p.filename, next)
  },
  function(txt, next) {
    sqls = txt.toString()
      .split(/; *\n/)
      .filter(function(block) {
        block = block
          .replace(/^ *#.*\n/mg, '') // remove comment
          .replace(/\n/g, ' ')
          .replace(/^ +/, '')
          .replace(/ +$/, '')
        return block
      })
      .join(DELIMITER)
      .replace(/  +/g, ' ')
      .split(DELIMITER)
      .filter(function(sql) {
        return sql
      })
    db.query(`create table if not exists ${SCHEMA} (basename varchar(100), n int)`, next)
  },
  function(rows, info, next) {
    db.query(`select n from ${SCHEMA} where basename='${basename}'`, next)
  },
  function(rows, info, next) {
    if (rows.length > 0) {
      old_n = rows[0].n
      return next(null, null, null)
    }
    old_n = 0
    db.query(`insert into ${SCHEMA} (basename,n) values ('${basename}', 0)`, next)
  },
  function(rows, info, next) {

    async.eachSeries(sqls.slice(old_n), function(sql, nextSql) {

      async.waterfall([
      function(next1) {
        db.query(sql, next1)
      },
      function(rows, info, next1) {
        db.query(`update ${SCHEMA} set n = n + 1 where basename='${basename}'`, next1)
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
const path = require('path')
const SCHEMA = '`__schema__v1_1`'
const DELIMITER = '@ZNB810256-LINE@'
