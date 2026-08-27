'use client'

import BasicConverter from "@/Components/MainView/MainPanel/BasicConverter";
import { useEffect, useState } from "react";

function md4(input: Uint8Array): string {
  const msg = input;
  const msgLen = msg.length;

  // Pre-processing: padding
  const bitLen = msgLen * 8;
  const padLen = (56 - (msgLen + 1) % 64 + 64) % 64;
  const padded = new Uint8Array(msgLen + 1 + padLen + 8);
  padded.set(msg);
  padded[msgLen] = 0x80;

  // Append length in bits as 64-bit little-endian
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bitLen >>> 0, true);
  view.setUint32(padded.length - 4, 0, true);

  // Helper functions
  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & y) | (x & z) | (y & z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const rotl = (v: number, n: number) => (v << n) | (v >>> (32 - n));

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let i = 0; i < padded.length; i += 64) {
    const X = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      X[j] = view.getUint32(i + j * 4, true);
    }

    let a = a0, b = b0, c = c0, d = d0;

    // Round 1
    const r1 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    const s1 = [3,7,11,19,3,7,11,19,3,7,11,19,3,7,11,19];
    for (let j = 0; j < 16; j++) {
      const t = (a + F(b, c, d) + X[r1[j]]) >>> 0;
      a = d; d = c; c = b; b = rotl(t, s1[j]);
    }

    // Round 2
    const r2 = [0,4,8,12,1,5,9,13,2,6,10,14,3,7,11,15];
    const s2 = [3,5,9,13,3,5,9,13,3,5,9,13,3,5,9,13];
    for (let j = 0; j < 16; j++) {
      const t = (a + G(b, c, d) + X[r2[j]] + 0x5a827999) >>> 0;
      a = d; d = c; c = b; b = rotl(t, s2[j]);
    }

    // Round 3
    const r3 = [0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15];
    const s3 = [3,9,11,15,3,9,11,15,3,9,11,15,3,9,11,15];
    for (let j = 0; j < 16; j++) {
      const t = (a + H(b, c, d) + X[r3[j]] + 0x6ed9eba1) >>> 0;
      a = d; d = c; c = b; b = rotl(t, s3[j]);
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const result = new Uint8Array(16);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, a0, true);
  rv.setUint32(4, b0, true);
  rv.setUint32(8, c0, true);
  rv.setUint32(12, d0, true);

  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
}

function ntlmHash(password: string): string {
  // NTLM: MD4 of UTF-16LE encoded password
  const utf16le = new Uint8Array(password.length * 2);
  for (let i = 0; i < password.length; i++) {
    const code = password.charCodeAt(i);
    utf16le[i * 2] = code & 0xff;
    utf16le[i * 2 + 1] = (code >> 8) & 0xff;
  }
  return md4(utf16le);
}

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
