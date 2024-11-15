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

    # Print the extracted variables
    #for key in "${!variables[@]}"; do
    #    echo "$key=${variables[$key]}"
    #done
}
#}}}

extract_variables "$QUERY_STRING"

DBHASH=$(sqlite3 database.db  "select pwdhash from users where username='$USER';")

if [[ $HASH == $DBHASH ]]; then
    echo 0
else
    echo 1;
fi
