'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { useEffect, useState } from "react";
import { ntlmHash } from "@/Components/Functions/Md4Tools/logic";

export const NTLM = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from !== '') {
      setFromValue(from);
      setToValue(ntlmHash(from));
    }
  }, []);

  useEffect(() => {
    if (fromValue.length !== 0) {
      setToValue(ntlmHash(fromValue));
    } else {
      setToValue('');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="NTLM Hash Generator"
      description="NTLM hashing uses MD4 on the UTF-16LE encoded password. It is used in Windows authentication. For example, the string [1 password 2] becomes [1 8846f7eaee8fb117ad06bdd830b7586c 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Password Input"
      toTitle="NTLM Hash"
      backColor="teal"
    />
  );
};
