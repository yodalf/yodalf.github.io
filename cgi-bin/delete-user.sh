#!/usr/bin/env bash

# $1 = User
sqlite3 database.db "DELETE FROM users WHERE username='$1';"


