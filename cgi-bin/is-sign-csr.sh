set -x

mkdir -p TMP
mkdir -p PKI/NEW_CERTS
touch PKI/SELF_PKI/is-index.txt

# Function to parse URL parameters
parse_url_params() {
    local query_string="$1"
    
    # Split query string into individual params
    local IFS='&'
    read -ra params <<< "$query_string"

    echo "${params[0]}" | base64 -d > TMP/t
    USER="${params[1]}"
    HASH="${params[2]}"
}

parse_url_params "${QUERY_STRING}"

rm -f TMP/cert.pem

# Check if we already have a DevID for that user
DBCERT=$(sqlite3 database.db "select cert from users where username='$USER';")
DBHASH=$(sqlite3 database.db  "select pwdhash from users where username='$USER';")

if [[ -n $DBCERT ]]; then
    echo 1
    exit 1
fi

if [[ ! $HASH == $DBHASH ]]; then
    echo 2
    exit 2
fi


echo "*** ROOT ***"
cat PKI/SELF_PKI/ca/root-ca.crt 
echo "*** IS ***"
cat PKI/SELF_PKI/ca/is-ca.crt 
echo "*** AS ***"
cat PKI/SELF_PKI/ca/as-ca.crt 

echo "*** IS-CA SIGNED CSR ***"
yes | openssl ca -notext -config PKI/TEMPLATES/is-csr-sign.conf  -policy signing_policy -create_serial -rand_serial -extensions signing_req -out TMP/cert.pem -infiles TMP/t  

CERT=$(openssl x509 -in TMP/cert.pem)

# Push the cert to the database
sqlite3 database.db "UPDATE users set cert='$CERT' where pwdhash='$HASH'"
 

cat TMP/cert.pem

#rm -f TMP/t
#rm -f TMP/cert.pem

