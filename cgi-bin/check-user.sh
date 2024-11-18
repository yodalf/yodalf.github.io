set -x

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
        echo 2
    else
        if [[ $IDHASH == $DBCERTHASH ]]; then
            echo 0
        else
            echo 1
        fi
    fi
else
    echo 1;
fi
