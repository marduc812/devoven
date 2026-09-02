'use client'

import AdvancedConverter from "@/Components/MainView/MainPanel/AdvancedConverter";
import { PasswordElement } from "@/Components/View/PasswordElement";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useShareLink } from "@/Components/Functions/ShareLink";
import CryptoJS from 'crypto-js'

export const HmacSHA224 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');
    const [passwd, setPasswd] = useState<string>('')



    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        const passQuery = searchParams.get('pass') ?? '';

        if (from != '') {
            setFromValue(from);
        }

        if (passQuery != '') {
            setPasswd(passQuery);
        }
    }, [])

    useShareLink({ pass: passwd })

    useEffect(() => {
        if (fromValue.length > 0) {
            setToValue(CryptoJS.HmacSHA224(fromValue, passwd).toString());
        } else {
            setToValue('')
        }
    }, [fromValue, passwd])



    return (
        <AdvancedConverter
            title="HMAC-SHA224 Hashing"
            description="HMAC-SHA224 is a specific type of message authentication code (MAC) involving a cryptographic hash function in combination with a secret cryptographic key. For example, the string [1 admin 2] with a key of [1 pass 2] becomes [1 a8bdafcc839f9b52a5afa3ad88b89a3f21bfd4f929129ebed9152aaa 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='HMAC-SHA224 Hash'
            extraElements={<PasswordElement passwd={passwd} setPasswd={setPasswd} />}
            backColor='teal'
        />
    )
}