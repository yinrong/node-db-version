node-db-version
==================
version control for database schema.

Each SQL in a file will be executed only once.

__sqls.txt__
```sql
# intial version 2016-08-26
create table user (
  id int,
  name string
);

# changed 2016-09-01
alter table user add mail string;
```

```javascript
const dbversion = require('db-version')
const conn = getMysqlConnection() // reference https://github.com/mysqljs/mysql#introduction
dbversion.apply(
  {
    connection: conn,
    filename: 'sqls.txt',
    onExecuted: function(sql) {
      console.log('executed:', sql)
    },
  },
  function(err, info) {
    console.log('All applied.')
    
    // do anything else
  })
```
