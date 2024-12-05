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
        echo -n $JSON_RET
    else
        if [[ $IDHASH == $DBCERTHASH ]]; then
            # Get the user's public key
            T=$(mktemp)
            #sqlite3 database.db  "select cert from users where username='$USER';" | openssl x509 -pubkey -noout > $T
            sqlite3 database.db  "select cert from users where username='$USER';"  > $T

            # Create an ephemeral sym key
            X=$(openssl aes-256-cbc -pbkdf2 -nosalt -P -k $(openssl rand -hex 16))
            KEY=$(echo $X | awk -F= '{print $2}' | cut -d ' ' -f1)
            IV=$(echo $X | awk -F= '{print $3}' | cut -d ' ' -f1)
            JSON_KEY=$( printf '{"key": "%s", "iv": "%s"}' "$KEY" "$IV" )


            if [[ -z $RESPONSE ]]; then
                # NONCE
                NONCE=$(openssl rand -hex 8)
                echo -n "$NONCE" > /tmp/NONCE
                # Return a NONCE challenge to be decrypted

                JSON_RET=$(printf '{"key": "%s", "nonce": "%s", "res": "%s"}' \
                    "$( echo -n "$JSON_KEY" |  openssl pkeyutl -encrypt -inkey $T -certin -in - -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -pkeyopt rsa_mgf1_md:sha256   | xxd -p -c0)" \
                    "$( echo -n "$NONCE" |  openssl pkeyutl -encrypt -inkey $T -certin -in - -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -pkeyopt rsa_mgf1_md:sha256   | xxd -p -c0)" \
                    "3")
                rm -f $T
                echo -n $JSON_RET
            else
                # Check if the nonce was properly decrypted
                if [[ -e /tmp/NONCE ]]; then 
                    NONCE=$(cat /tmp/NONCE) 
                fi
                if [[ "$NONCE" == "$RESPONSE" ]]; then
                    # Return SUCCESS
                    JSON_RET=$(printf '{"key": "%s", "nonce": "%s", "res": "%s"}' "NONCE OK" "" "0" )
                else
                    JSON_RET=$(printf '{"key": "%s", "nonce": "%s", "res": "%s"}' "BAD MOBILE: key" "" "2" )
                fi

                rm -f /tmp/NONCE
                echo -n $JSON_RET
            fi
        else
            JSON_RET=$(printf '{"key": "BAD MOBILE: id", "nonce":"", "res": "3"}') 
            echo -n $JSON_RET
        fi
    fi
else
    JSON_RET=$(printf '{"key": "BAD CREDENTIALS", "nonce": "",  "res": "1"}')
    echo -n $JSON_RET
fi
