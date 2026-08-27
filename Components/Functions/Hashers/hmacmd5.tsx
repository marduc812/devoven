'use client'

import AdvancedConverter from "@/Components/MainView/MainPanel/AdvancedConverter";
import { PasswordElement } from "@/Components/View/PasswordElement";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from 'crypto-js'


export const HmacMD5 = () => {

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
            setToValue(CryptoJS.HmacMD5(fromValue, passwd).toString());
        } else {
            setToValue('')
        }
    }, [fromValue, passwd])



    return (
        <AdvancedConverter
            title="HMAC MD5 Hashing"
            description="HMAC-MD5 is a specific type of message authentication code (MAC) involving a cryptographic hash function in combination with a secret cryptographic key. For example, the string [1 admin 2] with a key of [1 pass 2] becomes [1 7b45e706ab14ae5891c3fa37cfaf8d9b 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='HMAC-MD5 Hash'
            extraElements={<PasswordElement passwd={passwd} setPasswd={setPasswd} />}
            extraLink={extraLink}
            backColor='teal'
        />
    )
}