#!/usr/bin/env bash

# $1 = User
# $2 = Pwd
# $3 = role
 
HASH=$(echo "$2" | sha256sum | cut -d ' ' -f 1)

# Create user private key and  cert request
#openssl req -newkey rsa:2048 -nodes -keyout TMP/user-private_key.pem -out TMP/user-csr.pem -subj "/C=CA/ST=Quebec/L=Quebec City/O= /OU= /CN=$1" -addext "subjectAltName=URI:https://ne201.com/user/$1" -text

# Sign the CSR
#yes | openssl ca -config PKI/TEMPLATES/is-csr-sign.conf  -policy signing_policy -extensions signing_req -out TMP/user-cert.pem -infiles TMP/user-csr.pem

# Export to PKCS12
#openssl pkcs12 -export -out TMP/user-cert.p12 -inkey TMP/user-private_key.pem  -in TMP/user-cert.pem -passin "pass:$2" -passout "pass:$2"

#sqlite3 database.db "INSERT INTO users (username, pwdhash, cert, role) VALUES ('$1', '$HASH', readfile('TMP/user-cert.pem'), $3)"
sqlite3 database.db "INSERT INTO users (username, pwdhash, role) VALUES ('$1', '$HASH', '$3')"


#mv TMP/user-cert.p12 .
#rm -f TMP/*


