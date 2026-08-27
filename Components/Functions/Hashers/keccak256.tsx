'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { keccak_256 } from "js-sha3";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const Keccak256 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');


    useEffect(() => {

        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';

        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(keccak_256(from))
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(keccak_256(fromValue))
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="Keccak-256 Hashing"
            description="Keccak-256, a variant of the Keccak family, was selected as the winner of the NIST hash function competition and later standardized as SHA-3 (Secure Hash Algorithm 3). Released by NIST on August 5, 2015, Keccak-256 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 acaf3289d7b601cbd114fb36c4d29c85bbfd5e133f14cb355c3fd8d99367964f 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='Keccak-256 Hash'
            backColor='teal'
        />
    )
}