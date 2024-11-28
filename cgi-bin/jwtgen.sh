#! /usr/bin/env bash

# echo -n "eyjHbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJFUzI1NmluT1RBIiwibmFtZSI6IkpvaG4gRG9lIn0" | openssl dgst -sha256 -binary -sign ec-secp256k1-priv-key.pem | openssl enc -base64 | tr -d '\n=' | tr -- '+/' '-_'

HEADER='{"alg":"RS256","typ":"JWT"}'

payload='{ "iss": "'$1'", "aud": "'$2'", "sub": "'$3'" }'

# Use jq to set the dynamic `iat` and `exp`
# fields on the payload using the current time.
# `iat` is set to now, and `exp` is now + 1 hour. Note: 3600 seconds = 1 hour
PAYLOAD=$(
echo "${payload}" | jq --arg uuid_str "$(uuidgen)" --arg time_str "$(date +%s)" \
  '
  ($time_str | tonumber) as $time_num
  | .iat=$time_num
  | .exp=($time_num + 60 * 60 * '$4')
  | .jti=$uuid_str
  '
)

#PAYLOAD='{"sub":"1234567890","name":"John Doe","admin":true,"iat":1516239022}'

function b64enc() { basenc -w 0 --base64url | tr -d '\n='  ;}
#function b64enc() { basenc -w 0 --base64url   ;}
function b64dec() { basenc -w 0 -d --base64url ;}
#function sign() { openssl dgst -binary -sha256 -sign PKI/SELF_PKI/ca/is-ca/private/is-ca.key | openssl enc -base64 | tr -d '\n=' | tr -- '+/' '-_' ; }
function sign() { openssl dgst -binary -sha256 -sign PKI/SELF_PKI/ca/is-ca/private/is-ca.key ; }
#function sign() { openssl dgst -sha256 -sign prv ; }

JWT_HDR_B64="$(echo -n "$HEADER" | b64enc)"
JWT_PAY_B64="$(echo -n "$PAYLOAD" | b64enc)"
UNSIGNED_JWT="$JWT_HDR_B64.$JWT_PAY_B64"
SIGNATURE=$(echo -n "$UNSIGNED_JWT" | sign | b64enc)
#SIGNATURE=$(echo -n "$UNSIGNED_JWT" | sign )

#echo
#echo -n $JWT_HDR_B64 | b64dec
#echo
#echo -n $JWT_PAY_B64 | b64dec
#echo
#echo
#echo $UNSIGNED_JWT
#echo
#echo $SIGNATURE
#echo

echo "$UNSIGNED_JWT.$SIGNATURE"
#echo

