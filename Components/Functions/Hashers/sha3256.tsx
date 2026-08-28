'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { sha3_256 } from "js-sha3";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const SHA3256 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');


    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(sha3_256(from))
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(sha3_256(fromValue))
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="SHA3-256 Hashing"
            description="SHA-3 (Secure Hash Algorithm 3) is the latest member of the Secure Hash Algorithm family of standards, released by NIST on August 5, 2015. SHA3-256 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 1af17a664e3fa8e419b8ba05c2a173169df76162a5a286e0c405b460d478f7ef 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='SHA3-256 Hash'
            backColor='teal'
        />
    )
}