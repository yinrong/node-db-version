const dbversion = require('..')
const async = require('async')
const mysql = require('mysql')

function connect(database) {
  var cfg = {
    host     : 'localhost',
    user     : 'root',
    password : '',
  }
  if (database) cfg.database = database
  return mysql.createConnection(cfg)
}

var conn

async.waterfall([
function(next) {
  conn = connect()
  conn.query('drop database if exists db_version_dev', next)
},
function(rows, info, next) {
  conn.query('create database db_version_dev', next)
},
function(rows, info, next) {
  conn.end()
  conn = connect('db_version_dev')
  dbversion.apply(
    {
      connection: conn,
      filename: __dirname + '/sqls.txt',
      onExecuted: function(sql) {
        console.log('executed:', sql)
      },
    },
    next)
},
function(info, next) {
  dbversion.apply(
    {
      connection: conn,
      filename: __dirname + '/sqls.txt',
      onExecuted: function(sql) {
        assert(false, 'no sql should be executed')
      },
    },
    next)
},
function(info, next) {
  console.log('ok')
  conn.end()
},
], function(err) {
  throw err
})


