'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from 'crypto-js'

export const RIPEMD160 = ({ article }: { article?: React.ReactNode } = {}) => {

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
            article={article}
            title="RIPEMD160 hash generator"
            description="Generate a [1 RIPEMD160 2] hash from UTF-8 text. The output is a 160-bit digest shown as 40 hexadecimal characters. Letter case, spaces, and line breaks affect the result. This tool hashes text directly and does not perform Bitcoin HASH160."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='RIPEMD160 Hash'
            backColor='teal'
        />
    )
}