#!/usr/bin/env bash

rm -f database.db

sqlite3 database.db "CREATE TABLE users ( id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, pwdhash TEXT, CERT TEXT);"
                
