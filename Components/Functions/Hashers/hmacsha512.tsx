'use client'

import AdvancedConverter from "@/Components/MainView/MainPanel/AdvancedConverter";
import { PasswordElement } from "@/Components/View/PasswordElement";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from 'crypto-js'

export const HmacSHA512 = () => {

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
            setToValue(CryptoJS.HmacSHA512(fromValue, passwd).toString());
        } else {
            setToValue('')
        }
    }, [fromValue, passwd])



    return (
        <AdvancedConverter
            title="HMAC-SHA512 Hashing"
            description="HMAC-SHA512 is a specific type of message authentication code (MAC) involving a cryptographic hash function in combination with a secret cryptographic key. For example, the string [1 admin 2] with a key of [1 pass 2] becomes [1 4fd839c925db362fafb33edfc12e8dc3816d6c16ea3141fc92e1aca828ea8e6bbc8a184aa06955f8ef76008a765decc605fe67e8700da7bc85020b3b6d296030 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='HMAC-SHA512 Hash'
            extraElements={<PasswordElement passwd={passwd} setPasswd={setPasswd} />}
            extraLink={extraLink}
            backColor='teal'
        />
    )
}