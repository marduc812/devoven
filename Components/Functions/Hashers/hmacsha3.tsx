'use client'

import AdvancedConverter from "@/Components/MainView/MainPanel/AdvancedConverter";
import { PasswordElement } from "@/Components/View/PasswordElement";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from 'crypto-js'

export const HmacSHA3 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');
    const [passwd, setPasswd] = useState<string>('')
    const [extraLink, setExtraLink] = useState<string>('');

    useEffect(() => {

        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        const passQuery = searchParams.get('pass') ?? '';

        if (from != '') {
            if (passQuery && passQuery.length > 0) {
                setPasswd(passwd)
                setFromValue(from);
            }
        }
    }, [])

    useEffect(() => {
        setExtraLink('&pass=' + passwd)
        if (fromValue.length > 0) {
            setToValue(CryptoJS.HmacSHA3(fromValue, passwd).toString());
        } else {
            setToValue('')
        }
    }, [fromValue, passwd])



    return (
        <AdvancedConverter
            title="HMAC-SHA3 Hashing"
            description="HMAC-SHA3 is a specific type of message authentication code (MAC) involving a cryptographic hash function in combination with a secret cryptographic key. For example, the string [1 admin 2] with a key of [1 pass 2] becomes [1 a288302143222abccf791927ee962de091921a0ee008f1711154766374fbcd5b17ba6b58902890f9123183215115ff11d73d2bf55dbea22e3c16c28c9ff97393 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='HMAC-SHA3 Hash'
            extraElements={<PasswordElement passwd={passwd} setPasswd={setPasswd} />}
            extraLink={extraLink}
            backColor='teal'
        />
    )
}