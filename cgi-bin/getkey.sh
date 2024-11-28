#!/usr/bin/env bash

# $1 = User
sqlite3 ./database.db  "select cert from users where username='$1';" | openssl x509 -pubkey -noout

