OBJ=$(echo $QUERY_STRING | base64 -d)
USER=$(echo $OBJ | jq -r .usr)
HASH=$(echo $OBJ | jq -r .hash)
IDHASH=$(echo $OBJ | jq -r .idHash)
RESPONSE=$(echo $OBJ | jq -r .response)

DBUSERHASH=$(sqlite3 database.db  "select pwdhash from users where username='$USER';")
DBCERTHASH=$(sqlite3 database.db  "select cert from users where username='$USER';" | sha256sum | cut -d ' ' -f1)

#echo $IDHASH
#echo $DBCERTHASH

#echo $USER
#echo $HASH
#echo $DBCERTHASH

if [[ $HASH == $DBUSERHASH ]]; then
    # EMPTY CERTIFICATE !
    if [[ $DBCERTHASH == "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b" ]]; then
        JSON_RET=$(printf '{"key": "", "nonce":"","res": "2"}' )
    else
        JSON_RET=$(printf '{"key": "%s", "nonce": "%s", "res": "%s"}' "NONCE OK" "dummy" "0" )
    fi
    echo -n $JSON_RET
else
    JSON_RET=$(printf '{"key": "BAD CREDENTIALS", "nonce": "",  "res": "1"}')
    echo -n $JSON_RET
fi
