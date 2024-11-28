#!/usr/bin/env bash

X=$(openssl aes-256-cbc -pbkdf2 -nosalt -P -k $(openssl rand -hex 16))
KEY=$(echo $X | awk -F= '{print $2}' | cut -d ' ' -f1)
IV=$(echo $X | awk -F= '{print $3}' | cut -d ' ' -f1)


X=$(echo "XYZ" | openssl aes-256-cbc -K $KEY -iv $IV  -nosalt -in - | xxd  -p)
#openssl aes-256-cbc -K "f305c553ff811197110f6b84541687fe51ba922d4da508fc222316ba4f010a6c" -iv "3cb8611d0fb0931b370bf982ecf06300"  -nosalt -d  -in 

T=$(mktemp)
sqlite3 database.db  "select cert from users where username='admin';" | openssl x509 -pubkey -noout > $T

cat $T

rm $T

#
# echo "Hello World!" > message.txt
# openssl enc -aes256 -in message.txt -out message.enc -kfile private.pem
# Decrypt the file
#openssl enc -d -aes256 -in encrypted_file.enc -out decrypted_file.txt -kfile private_key.pem

# A=KJUR.crypto.Cipher.encrypt("11223344556677ff",k,"aes256-CBC",{ iv: iv })
# KJUR.crypto.Cipher.decrypt(A,k,"aes256-CBC",{ iv: iv })
#
