'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { keccak_512 } from "js-sha3";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const Keccak512 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');

    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';

        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(keccak_512(from))
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(keccak_512(fromValue))
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="Keccak-512 Hashing"
            description="Keccak-512, a variant of the Keccak family, was selected as the winner of the NIST hash function competition and later standardized as SHA-3 (Secure Hash Algorithm 3). Released by NIST on August 5, 2015, Keccak-512 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 eda765576c84c600ed7f5d97510e92703b61f5215def2a161037fd9dd1f5b6ed4f86ce46073c0e3f34b52de0289e9c618798fff9dd4b1bfe035bdb8645fc6e37 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='Keccak-512 Hash'
            backColor='teal'
        />
    )
}