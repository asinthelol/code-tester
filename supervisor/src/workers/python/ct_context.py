"""
Builds ctx.pg / ctx.redis / ctx.mysql for Python suites.
"""

import os
import time
import types

CONNECT_RETRY_ATTEMPTS = 5
CONNECT_RETRY_DELAY_S = 1


def _with_connect_retry(connect):
    # A compose healthcheck reporting "healthy" doesn't guarantee a backing
    # service is actually ready to accept connections yet.
    last_error = None
    for attempt in range(1, CONNECT_RETRY_ATTEMPTS + 1):
        try:
            return connect()
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt < CONNECT_RETRY_ATTEMPTS:
                time.sleep(CONNECT_RETRY_DELAY_S)
    raise last_error


class _QueryClient:
    """
    Wraps a DB-API connection so suite authors get the same
    ctx.<client>.query(sql, params).rows shape as the Node/JS side.
    """

    def __init__(self, connection):
        self._connection = connection

    def query(self, sql, params=None):
        cursor = self._connection.cursor()
        try:
            cursor.execute(sql, params or [])
            try:
                rows = cursor.fetchall()
            except Exception:  # noqa: BLE001
                rows = []
            self._connection.commit()
            return types.SimpleNamespace(rows=rows)
        finally:
            cursor.close()


def _connect_pg():
    import psycopg2

    connection = psycopg2.connect(
        host=os.environ.get("PG_HOST"),
        port=int(os.environ["PG_PORT"]) if os.environ.get("PG_PORT") else 5432,
        user=os.environ.get("PG_USER"),
        password=os.environ.get("PG_PASSWORD"),
        dbname=os.environ.get("PG_DATABASE"),
    )
    return _QueryClient(connection)


def _connect_redis():
    import redis

    client = redis.Redis(
        host=os.environ.get("REDIS_HOST"),
        port=int(os.environ["REDIS_PORT"]) if os.environ.get("REDIS_PORT") else 6379,
    )
    client.ping()
    return client


def _connect_mysql():
    import pymysql

    connection = pymysql.connect(
        host=os.environ.get("MYSQL_HOST"),
        port=int(os.environ["MYSQL_PORT"]) if os.environ.get("MYSQL_PORT") else 3306,
        user=os.environ.get("MYSQL_USER"),
        password=os.environ.get("MYSQL_PASSWORD"),
        database=os.environ.get("MYSQL_DATABASE"),
    )
    return _QueryClient(connection)


def connect_context():
    # Undefined (None) attributes when the corresponding *_HOST env var
    # isn't set, so suites (and environments) that don't need a given
    # service don't need one.
    ctx = types.SimpleNamespace(pg=None, redis=None, mysql=None)

    if os.environ.get("PG_HOST"):
        ctx.pg = _with_connect_retry(_connect_pg)

    if os.environ.get("REDIS_HOST"):
        ctx.redis = _with_connect_retry(_connect_redis)

    if os.environ.get("MYSQL_HOST"):
        ctx.mysql = _with_connect_retry(_connect_mysql)

    return ctx
