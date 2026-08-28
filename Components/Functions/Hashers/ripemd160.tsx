'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from 'crypto-js'

export const RIPEMD160 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');


    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(CryptoJS.RIPEMD160(from).toString())
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(CryptoJS.RIPEMD160(fromValue).toString())
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="RIPEMD160 Hashing"
            description="RIPEMD160 (RACE Integrity Primitives Evaluation Message Digest) is a cryptographic hash function designed by the EU project RIPE (RACE Integrity Primitives Evaluation) in 1996. RIPEMD160 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. It produces a 160-bit hash value, often rendered as a 40-digit hexadecimal number. For example, the string [1 Hello, World! 2] becomes [1 527a6a4b9a6da75607546842e0e00105350b1aaf 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='RIPEMD160 Hash'
            backColor='teal'
        />
    )
}