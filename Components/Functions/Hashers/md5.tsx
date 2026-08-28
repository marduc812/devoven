'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

export const MD5 = () => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');

    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(CryptoJS.MD5(from).toString())
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(CryptoJS.MD5(fromValue).toString())
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            title="MD5 Hashing"
            description="MD5 hashing is a method to convert arbitrary data into a fixed-size sequence of characters, which typically represents a checksum or fingerprint of the original data. For example, the string [1 Hello, World! 2] becomes [1 65a8e27d8879283831b664bd8b7f0ad4 2]."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='MD5 Hash'
            backColor='teal'
        />
    )
}