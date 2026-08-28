'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { keccak_384 } from "js-sha3";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const Keccak384 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');


    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(keccak_384(from))
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(keccak_384(fromValue))
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="Keccak-384 Hashing"
            description="Keccak-384, a variant of the Keccak family, was selected as the winner of the NIST hash function competition and later standardized as SHA-3 (Secure Hash Algorithm 3). Released by NIST on August 5, 2015, Keccak-384 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 4d60892fde7f967bcabdc47c73122ae6311fa1f9be90d721da32030f7467a2e3db3f9ccb3c746483f9d2b876e39def17 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='Keccak-384 Hash'
            backColor='teal'
        />
    )
}