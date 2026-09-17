'use client'

import AdvancedConverter from "@/Components/MainView/MainPanel/AdvancedConverter";
import { PasswordElement } from "@/Components/View/PasswordElement";
import { useEffect, useState } from "react";
import { useShareLink } from "@/Components/Functions/ShareLink";
import { HmacSha256Article } from "./hmacsha256Article";
import CryptoJS from 'crypto-js'

type Encoding = 'hex' | 'base64';

export const HmacSHA256 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');
    const [passwd, setPasswd] = useState<string>('')
    const [encoding, setEncoding] = useState<Encoding>('hex')

    useEffect(() => {

        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        const passQuery = searchParams.get('pass') ?? '';
        const encodingQuery = searchParams.get('encoding') ?? '';

        if (from != '') {
            setFromValue(from);
        }

        if (passQuery != '') {
            setPasswd(passQuery);
        }

        if (encodingQuery === 'base64') {
            setEncoding('base64');
        }
    }, [])

    useShareLink({ pass: passwd, encoding })

    useEffect(() => {
        if (fromValue.length > 0) {
            const tag = CryptoJS.HmacSHA256(fromValue, passwd);
            // Same 32 bytes either way. Which alphabet an API wants is the
            // usual reason a correct signature looks like a mismatch.
            setToValue(tag.toString(encoding === 'base64' ? CryptoJS.enc.Base64 : CryptoJS.enc.Hex));
        } else {
            setToValue('')
        }
    }, [fromValue, passwd, encoding])

    return (
        <AdvancedConverter
            title="HMAC-SHA256 Generator"
            description="Generate an HMAC-SHA256 message authentication code from a message and a secret key, in hex or Base64. For example, the string [1 admin 2] with a key of [1 pass 2] becomes [1 2eee8449f2f9b728bdb01faf9db9bec46d2561fb428286548304a7db2d9d4cdc 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Message'
            toTitle={encoding === 'base64' ? 'HMAC-SHA256 (Base64)' : 'HMAC-SHA256 (hex)'}
            article={HmacSha256Article}
            extraElements={
                <div className="flex flex-row flex-wrap gap-4 items-center">
                    <PasswordElement passwd={passwd} setPasswd={setPasswd} />
                    <div className="h-6 w-px bg-gray-300" />
                    <div className="flex flex-row items-center gap-2">
                        <label htmlFor="hmac-encoding" className="text-gray-600 text-sm font-medium flex-shrink-0">Output:</label>
                        <select
                            id="hmac-encoding"
                            value={encoding}
                            onChange={(e) => setEncoding(e.target.value as Encoding)}
                            className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
                        >
                            <option value="hex">Hex</option>
                            <option value="base64">Base64</option>
                        </select>
                    </div>
                </div>
            }
            backColor='teal'
        />
    )
}
