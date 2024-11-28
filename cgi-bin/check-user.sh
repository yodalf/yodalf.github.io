function extract_variables() { #{{{
    local encoded_string="$1"
    
    # Split the string into key-value pairs
    IFS='&' read -ra pairs <<< "$encoded_string"
    
    declare -A variables
    
    for pair in "${pairs[@]}"; do
        if [ -n "$pair" ]; then
            key="${pair%%=*}"
            value="${pair#*=}"
            
            # Decode the value
            decoded_value=$(echo "$value" | sed 's/+/%20/g; s/%\([0-9a-f]\{2\}\)/\\x\1/g')
            
            # Add the decoded key-value pair to the array
            variables["$key"]="$decoded_value"
        fi
    done

    USER=${variables["user"]}
    HASH=${variables["hash"]}
    IDHASH=${variables["idHash"]}

    # Print the extracted variables
    #for key in "${!variables[@]}"; do
    #    echo "$key=${variables[$key]}"
    #done
}
#}}}

extract_variables "$QUERY_STRING"

DBUSERHASH=$(sqlite3 database.db  "select pwdhash from users where username='$USER';")
DBCERTHASH=$(sqlite3 database.db  "select cert from users where username='$USER';" | sha256sum | cut -d ' ' -f1)



#echo $USER
#echo $HASH
#echo $DBCERTHASH

if [[ $HASH == $DBUSERHASH ]]; then
    if [[ $DBCERTHASH == "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b" ]]; then
        # empty cert
        JSON_RET=$(printf '{"key": "", "res": "2"}' )
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
            echo -n $JSON_KEY > TEST/ch_JK
            #ENCODED=$(echo $JSON_KEY | base64)

            # Encrypt with user<s public key
            #JSON_RET=$(printf '{"key": "%s", "res": "%s"}' "$( echo $JSON_KEY |  openssl pkeyutl -encrypt -inkey $T -certin -in - | xxd -p -c0)" "0")
            
            cp $T TEST/ch_inkey
            JSON_RET=$(printf '{"key": "%s", "res": "%s"}' "$( echo -n $JSON_KEY |  openssl pkeyutl -encrypt -inkey $T -certin -in - -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -pkeyopt rsa_mgf1_md:sha256   | xxd -p -c0)" "0")
            echo -n $JSON_RET > TEST/ch_JR

            rm -f $T
            echo -n $JSON_RET
        else
            JSON_RET=$(printf '{"key": "", "res": "1"}') 
            echo -n $JSON_RET
        fi
    fi
else
    JSON_RET=$(printf '{"key": "", "res": "1"}')
    echo -n $JSON_RET
fi
