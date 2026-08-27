'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { sha3_224 } from "js-sha3";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";


export const SHA3224 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');

    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';

        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(sha3_224(from))
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(sha3_224(fromValue))
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="SHA3-224 Hashing"
            description="SHA-3 (Secure Hash Algorithm 3) is the latest member of the Secure Hash Algorithm family of standards, released by NIST on August 5, 2015. SHA3-224 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 853048fb8b11462b6100385633c0cc8dcdc6e2b8e376c28102bc84f2 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='SHA3-224 Hash'
            backColor='teal'
        />
    )
}