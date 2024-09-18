#!/usr/bin/env bash

# $1 = User
# $2 = Pwd

# Create user cert
openssl req -newkey rsa:2048 -nodes -keyout TMP/user-private_key.pem -out TMP/user-csr.pem -subj "/C=CA/ST=Quebec/L=Quebec City/O= /OU= /CN=$1" -addext "subjectAltName=URI:https://ne201.com/user/$1" -text
yes | openssl ca -config PKI/TEMPLATES/is-csr-sign.conf  -policy signing_policy -extensions signing_req -out TMP/user-cert.pem -infiles TMP/user-csr.pem
openssl pkcs12 -export -out TMP/user-cert.p12 -inkey TMP/user-private_key.pem  -in TMP/user-cert.pem -passin "pass:$2" -passout "pass:$2"


HASH=$(echo "$2" | sha256sum | cut -d ' ' -f 1)
sqlite3 database.db "INSERT INTO users (username, pwdhash, cert) VALUES ('$1', '$HASH', readfile('TMP/user-cert.pem'))"

rm -f TMP/*


