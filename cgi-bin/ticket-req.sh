
OBJ=$(echo $QUERY_STRING | base64 -d)
USER=$(echo $OBJ | jq -r .usr)
HASH=$(echo $OBJ | jq -r .hash)
IDHASH=$(echo $OBJ | jq -r .idHash)
AUDIENCE=$(echo $OBJ | jq -r .aud)
SUBJECT=$(echo $OBJ | jq -r .sub)
LIFETIME=$(echo $OBJ | jq -r .life)
RESPONSE=$(echo $OBJ | jq -r .response)

DBUSERHASH=$(sqlite3 database.db  "select pwdhash from users where username='$USER';")
DBCERT=$(sqlite3 database.db  "select cert from users where username='$USER';")
DBCERTHASH=$(sqlite3 database.db  "select cert from users where username='$USER';" | sha256sum | cut -d ' ' -f1)

#echo $OBJ
#echo $USER
#echo $HASH
#echo $IDHASH
#echo $AUDIENCE
#echo $SUBJECT
#echo $LIFETIME
#echo $RESPONSE
#echo $DBUSERHASH
#echo $DBCERTHASH
#echo $DBCERT


# Initiate  a challenge-response
if [[ -z $RESPONSE ]]; then
    ./check-user.sh $QUERY_STRING
else
    # Check if the nonce was properly decrypted
    if [[ -e /tmp/NONCE ]]; then
        NONCE=$(cat /tmp/NONCE)
    fi
    #rm -f /tmp/NONCE
    if [[ "$NONCE" == "$RESPONSE" ]]; then
        # Return SUCCESS
        # Create the token
        TOK=$(./jwtgen.sh $QUERY_STRING)  
        JSON_RET=$(printf '{"token": "%s", "res": "%s"}' $TOK "0" )
    else
        # FAIL
        # Return empty token
        TOK=$(./jwtgen.sh )  
        JSON_RET=$(printf '{"token": "%s", "res": "%s"}' $TOK "r10" )
    fi
    

    echo $JSON_RET
fi

