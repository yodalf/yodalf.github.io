set -x

echo ${QUERY_STRING:5} | base64 -d > TMP/t

rm -f TMP/idevid.pem

echo "*** ROOT ***"
cat PKI/SELF_PKI/ca/root-ca.crt 
echo "*** IS ***"
cat PKI/SELF_PKI/ca/is-ca.crt 
echo "*** AS ***"
cat PKI/SELF_PKI/ca/as-ca.crt 

echo "*** IDEVID ***"
yes | openssl ca -config PKI/TEMPLATES/csr-sign.conf  -policy signing_policy -extensions signing_req -out TMP/idevid.pem -infiles TMP/t  
cat TMP/idevid.pem

rm -f TMP/t
rm -f TMP/idevid.pem

