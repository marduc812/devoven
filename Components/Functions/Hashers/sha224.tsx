'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

export const SHA224 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');


    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(CryptoJS.SHA224(from).toString())
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(CryptoJS.SHA224(fromValue).toString())
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="SHA224 Hashing"
            description="SHA-2 (Secure Hash Algorithm 2) is a set of cryptographic hash functions designed by the United States National Security Agency (NSA) and first published in 2001. SHA224 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 72a23dfa411ba6fde01dbfabf3b00a709c93ebf273dc29e2d8b261ff 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='SHA224 Hash'
            backColor='teal'
        />
    )
}