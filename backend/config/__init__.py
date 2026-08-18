"""Config package."""

# Ensure PyMySQL is available as MySQLdb for environments without mysqlclient C bindings
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
