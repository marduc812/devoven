'use client'

import AdvancedConverter from "@/Components/MainView/MainPanel/AdvancedConverter";
import { PasswordElement } from "@/Components/View/PasswordElement";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from 'crypto-js'


export const HmacSHA384 = () => {

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
            setToValue(CryptoJS.HmacSHA384(fromValue, passwd).toString());
        } else {
            setToValue('')
        }
    }, [fromValue, passwd])



    return (
        <AdvancedConverter
            title="HMAC-SHA384 Hashing"
            description="HMAC-SHA384 is a specific type of message authentication code (MAC) involving a cryptographic hash function in combination with a secret cryptographic key. For example, the string [1 admin 2] with a key of [1 pass 2] becomes [1 3e4d38cec952369f2d5ef10734387b2b17159b3cbac1411778b306b4835733cad6ae5ea23c691cc3cedc313069eb1576 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='HMAC-SHA384 Hash'
            extraElements={<PasswordElement passwd={passwd} setPasswd={setPasswd} />}
            extraLink={extraLink}
            backColor='teal'
        />
    )
}