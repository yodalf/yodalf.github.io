#! /usr/bin/env bash
if [[ -n "$1" ]]; then
OBJ=$(echo $1 | base64 -d)
USER=$(echo $OBJ | jq -r .usr)
IDHASH=$(echo $OBJ | jq -r .idHash)
WORKER=$(echo $OBJ | jq -r .w)
AUDIENCE=$(echo $OBJ | jq -r .aud)
SUBJECT=$(echo $OBJ | jq -r .sub)
LIFETIME=$(echo $OBJ | jq -r .life)

CERT=$(echo "$2" | base64 -d)
else
USER="INVALID"
LIFETIME=0
fi

HEADER='{"alg":"RS256","typ":"JWT"}'

payload='{ "iss": "'$USER'", "aud": "'$AUDIENCE'", "sub": "'$SUBJECT'", "worker":"'$WORKER'", "wdevid":"'$CERT'" }'

# Use jq to set the dynamic `iat` and `exp`
# fields on the payload using the current time.
# `iat` is set to now, and `exp` is now + 1 hour. Note: 3600 seconds = 1 hour
PAYLOAD=$(
echo "${payload}" | jq --arg uuid_str "$(uuidgen)" --arg time_str "$(date +%s)" \
  '
  ($time_str | tonumber) as $time_num
  | .iat=$time_num
  | .exp=($time_num + 60 * 60 * '$LIFETIME')
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

