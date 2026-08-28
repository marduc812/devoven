'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { keccak_224 } from "js-sha3";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const Keccak224 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');

    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';

        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(keccak_224(from))
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(keccak_224(fromValue))
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="Keccak-224 Hashing"
            description="Keccak-224, a variant of the Keccak family, was selected as the winner of the NIST hash function competition and later standardized as SHA-3 (Secure Hash Algorithm 3). Released by NIST on August 5, 2015, Keccak-224 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 4eaaf0e7a1e400efba71130722e1cb4d59b32afb400e654afec4f8ce 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='Keccak-224 Hash'
            backColor='teal'
        />
    )
}