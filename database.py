
import sqlite3

DATABASE_NAME = "resq_ai.db"


def get_connection():

    connection = sqlite3.connect(DATABASE_NAME)

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()

    # SOS EVENTS

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            category TEXT NOT NULL,

            details TEXT,

            latitude REAL,

            longitude REAL,

            created_at TEXT NOT NULL

        )
    """)

    # EMERGENCY CONTACTS

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contacts (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            phone TEXT NOT NULL,

            relationship TEXT

        )
    """)

    connection.commit()

    connection.close()
