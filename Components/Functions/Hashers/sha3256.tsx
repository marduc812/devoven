'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { sha3_256 } from "js-sha3";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const SHA3256 = ({ article }: { article?: React.ReactNode } = {}) => {

    const [fromValue, setFromValue] = useState<string>('');
    const [toValue, setToValue] = useState<string>('');


    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );

        const from = searchParams.get('from') ?? '';
        if (from != '' && from.length !== 0) {
            setFromValue(from);
            setToValue(sha3_256(from))
        }
    }, [])


    useEffect(() => {
        if (fromValue.length !== 0) {
            setToValue(sha3_256(fromValue))
        } else {
            setToValue('')
        }

    }, [fromValue])

    return (
        <BasicConverter
            article={article}
            title="SHA3-256 hash generator"
            description="Generate a [1 SHA3-256 2] hash from UTF-8 text and copy the 64-character hexadecimal digest. SHA3-256 produces different results from SHA-256 and Keccak-256. Match the exact input, including spaces and line endings, when checking a digest."
            fromValue={fromValue}
            toValue={toValue}
            setFromValue={setFromValue}
            fromTitle='Text Input'
            toTitle='SHA3-256 Hash'
            backColor='teal'
        />
    )
}