#!/usr/bin/env bash
set -e
ExecDir=$(readlink -f `dirname "$0"`)

# Reference: https://pki-tutorial.readthedocs.io/en/latest/

#DEBUG=/dev/null
DEBUG=/dev/stdout

rm -rf SELF_PKI
mkdir -p SELF_PKI/etc

cp -r $ExecDir/TEMPLATES/* SELF_PKI/etc/

cd SELF_PKI

CURVE="secp112r1"

new-root-ca() { #{{{
mkdir -p ca/root-ca/private ca/root-ca/db crl certs
chmod 700 ca/root-ca/private

cp /dev/null ca/root-ca/db/root-ca.db
cp /dev/null ca/root-ca/db/root-ca.db.attr
echo 01 > ca/root-ca/db/root-ca.crt.srl
echo 01 > ca/root-ca/db/root-ca.crl.srl

# Create key
openssl ecparam -name $CURVE -genkey -noout -out ca/root-ca/private/root-ca.key 


openssl req -new \
    -nodes \
    -sha256 \
    -config etc/root-ca.conf \
    -out ca/root-ca.csr \
    -key ca/root-ca/private/root-ca.key \
    &> $DEBUG

yes | openssl ca -selfsign \
    -config etc/root-ca.conf \
    -in ca/root-ca.csr \
    -out ca/root-ca.crt \
    -extensions root_ca_ext \
    -enddate 20771231235959Z \
    &> $DEBUG


openssl ca -gencrl \
    -config etc/root-ca.conf \
    -out crl/root-ca.crl \
    &> $DEBUG

}
#}}}
new-ca() { #{{{
mkdir -p ca/$1-ca/private ca/$1-ca/db crl certs
chmod 700 ca/$1-ca/private

cp /dev/null ca/$1-ca/db/$1-ca.db
cp /dev/null ca/$1-ca/db/$1-ca.db.attr
echo 01 > ca/$1-ca/db/$1-ca.crt.srl
echo 01 > ca/$1-ca/db/$1-ca.crl.srl
touch $1-index.txt
touch $1-serial.txt

# Create key
openssl ecparam -name $CURVE -genkey -noout -out ca/$1-ca/private/$1-ca.key 

openssl req -new \
    -nodes \
    -sha256 \
    -config etc/$1-ca.conf \
    -out ca/$1-ca.csr \
    -key ca/$1-ca/private/$1-ca.key \
    &> $DEBUG

yes | openssl ca \
    -config etc/root-ca.conf  \
    -in ca/$1-ca.csr \
    -out ca/$1-ca.crt \
    -extensions signing_ca_ext \
    &> $DEBUG

openssl ca -gencrl \
    -config etc/$1-ca.conf \
    -out crl/$1-ca.crl \
    &> $DEBUG


cat ca/$1-ca.crt ca/root-ca.crt > \
    ca/$1-ca-chain.pem
}
#}}}
test-ca() { #{{{
# Operate

openssl req \
    -new \
    -nodes \
    -config etc/codesign.conf \
    -out certs/$1.csr \
    -keyout certs/$1.key \
    -sha384 \
    -subj "/C=CA/O=SELF/OU=SELF unit/ST=PAMA/L=Quebec/CN=$1 leaf certificate" \
    &> $DEBUG

yes | openssl ca \
    -config etc/$1-ca.conf \
    -in certs/$1.csr \
    -out certs/$1.crt \
    -extensions codesign_ext \
    &> $DEBUG

openssl pkcs12 \
    -export \
    -name "SELF Certificate" \
    -caname "SELF CA" \
    -caname "SELF Root CA" \
    -inkey certs/$1.key \
    -in certs/$1.crt \
    -certfile ca/$1-ca-chain.pem \
    -out certs/$1.p12 \
    -password pass:toto \
    &> $DEBUG

openssl pkcs12 -in certs/$1.p12 -out certs/$1.p12.key -nodes -nocerts -password pass:toto
openssl pkcs12 -in certs/$1.p12 -out certs/$1.p12.crt -nokeys -password pass:toto
openssl x509 -pubkey -noout -in certs/$1.crt > certs/$1.p12.pub

echo -n "Verify $1 cert chain: "
openssl verify -CAfile ca/root-ca.crt -untrusted ca/$1-ca.crt certs/$1.crt
echo -n "Test $1 sample signature: "
openssl dgst -sha256 -sign certs/$1.p12.key -out test.sig $ExecDir/test_file.txt
openssl dgst -verify certs/$1.p12.pub -signature test.sig $ExecDir/test_file.txt 
echo
rm test.sig
}
#}}}

new-root-ca root
new-ca is 
new-ca as 

test-ca as 
test-ca is

