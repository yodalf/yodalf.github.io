#!/usr/bin/env bash

rm -f database.db

sqlite3 database.db "CREATE TABLE users ( id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, pwdhash TEXT, cert TEXT, role TEXT);"
sqlite3 database.db "CREATE TABLE mdevs ( id INTEGER PRIMARY KEY AUTOINCREMENT, certserial NOT NULL UNIQUE, cert TEXT);"
sqlite3 database.db "CREATE TABLE sessions ( id INTEGER PRIMARY KEY AUTOINCREMENT, mdevserial NOT NULL, username TEXT, symkey TEXT, jwt TEXT);"
                
