set -x

mkdir -p TMP
mkdir -p PKI/NEW_CERTS

echo ${QUERY_STRING:5} | base64 -d > TMP/t

rm -f TMP/cert.pem

echo "*** ROOT ***"
cat PKI/SELF_PKI/ca/root-ca.crt 
echo "*** IS ***"
cat PKI/SELF_PKI/ca/is-ca.crt 
echo "*** AS ***"
cat PKI/SELF_PKI/ca/as-ca.crt 

echo "*** IS-CA SIGNED CSR ***"
yes | openssl ca -config PKI/TEMPLATES/is-csr-sign.conf  -policy signing_policy -create_serial -rand_serial -extensions signing_req -out TMP/cert.pem -infiles TMP/t  

cat TMP/cert.pem

#rm -f TMP/t
#rm -f TMP/cert.pem

