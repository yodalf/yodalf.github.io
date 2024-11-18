#!/usr/bin/env bash

# $1 = User
sqlite3 database.db "UPDATE users set cert='' where username='$1'"

