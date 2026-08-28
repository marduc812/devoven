'use client'

import AdvancedConverter from "@/Components/MainView/MainPanel/AdvancedConverter";
import { PasswordElement } from "@/Components/View/PasswordElement";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from 'crypto-js'

export const HmacRIPEMD160 = () => {

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
            setToValue(CryptoJS.HmacRIPEMD160(fromValue, passwd).toString());
        } else {
            setToValue('')
        }
    }, [fromValue, passwd])



    return (
        <AdvancedConverter
            title="HMAC-RIPEMD160 Hashing"
            description="HMAC-RIPEMD160 is a specific type of message authentication code (MAC) involving a cryptographic hash function in combination with a secret cryptographic key. For example, the string [1 admin 2] with a key of [1 pass 2] becomes [1 e53a9e8814fc323fe7f401d184e4b1c5bf64a95e 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='HMAC-RIPEMD160 Hash'
            extraElements={<PasswordElement passwd={passwd} setPasswd={setPasswd} />}
            extraLink={extraLink}
            backColor='teal'
        />
    )
}