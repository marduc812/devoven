'use client'

import AdvancedConverter from "@/Components/MainView/MainPanel/AdvancedConverter";
import { PasswordElement } from "@/Components/View/PasswordElement";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useShareLink } from "@/Components/Functions/ShareLink";
import CryptoJS from 'crypto-js'


export const HmacMD5 = ({ article }: { article?: React.ReactNode } = {}) => {

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
            setToValue(CryptoJS.HmacMD5(fromValue, passwd).toString());
        } else {
            setToValue('')
        }
    }, [fromValue, passwd])



    return (
        <AdvancedConverter
            article={article}
            title="HMAC-MD5 generator"
            description="Calculate [1 HMAC-MD5 2] from a message and secret key for legacy protocol compatibility. Both inputs use UTF-8 text, and the result is a 32-character hexadecimal code. For new integrations, see the HMAC-SHA256 generator linked below."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='HMAC-MD5 Hash'
            extraElements={<PasswordElement passwd={passwd} setPasswd={setPasswd} />}
            backColor='teal'
        />
    )
}