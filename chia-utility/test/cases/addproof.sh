#!/bin/bash

array=( 
    "0x81897a91b03a746d8572f18c2680712aafcb6968770f193d460ab2b61725a619"
    "0xa8068263bd62250f3caa758b0cd8d9893fd243d52bdb75f46dc40158d4e8d8dd"
    "0x1538b9b30740a8cb6219ce02f3d7a42d5a416e27b0f14ef24a0258b16f7cc5e3"
)
for i in "${array[@]}"
do
    curl -s -d '{ "parentCoinId": "'"$i"'" }' \
    -H "Content-Type: application/json" -X POST https://walletapi.chiabee.net/Wallet/get-puzzle  | python -m json.tool
done

