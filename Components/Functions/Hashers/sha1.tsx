'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

export const SHA1 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');


    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(CryptoJS.SHA1(from).toString())
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(CryptoJS.SHA1(fromValue).toString())
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="SHA1 Hashing"
            description="SHA-2 (Secure Hash Algorithm 2) is a set of cryptographic hash functions designed by the United States National Security Agency (NSA) and first published in 2001. SHA1 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 0a0a9f2a6772942557ab5355d76af442f8f65e01 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='SHA1 Hash'
            backColor='teal'
        />
    )
}