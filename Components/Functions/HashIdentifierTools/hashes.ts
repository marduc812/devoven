// Hash prototypes ported from Name-That-Hash by bee-san
// (https://github.com/bee-san/Name-That-Hash), GPL-3.0. DevOven is
// AGPL-3.0-or-later; GPLv3 section 13 permits that combination.
//
// Generated from name_that_hash/hashes.py. The upstream matcher uses
// re.match(), which anchors at position 0, so every pattern here is
// anchored with ^. The John the Ripper format is dropped on purpose:
// this tool reports the hashcat mode only.

import { Prototype } from './types';

export const prototypes: Prototype[] = [
  {
    regex: /^[a-f0-9]{4}$/i,
    modes: [
      { name: "CRC-16", hashcat: null },
      { name: "CRC-16-CCITT", hashcat: null },
      { name: "FCS-16", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{8}$/i,
    modes: [
      { name: "Adler-32", hashcat: null },
      { name: "CRC-32B", hashcat: null },
      { name: "FCS-32", hashcat: null },
      { name: "GHash-32-3", hashcat: null },
      { name: "GHash-32-5", hashcat: null },
      { name: "FNV-132", hashcat: null },
      { name: "Fletcher-32", hashcat: null },
      { name: "Joaat", hashcat: null },
      { name: "ELF-32", hashcat: null },
      { name: "XOR-32", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{6}$/i,
    modes: [
      { name: "CRC-24", hashcat: null },
    ],
  },
  {
    regex: /^(\$crc32\$)?([a-f0-9]{8}.)?[a-f0-9]{8}$/i,
    modes: [
      { name: "CRC-32", hashcat: 11500 },
    ],
  },
  {
    regex: /^\+[a-z0-9\/.]{12}$/i,
    modes: [
      { name: "Eggdrop IRC Bot", hashcat: null },
    ],
  },
  {
    regex: /^[a-z0-9\/.]{12}[.26AEIMQUYcgkosw]{1}$/i,
    modes: [
      { name: "DES(Unix)", hashcat: 1500 },
      { name: "Traditional DES", hashcat: 1500 },
      { name: "DEScrypt", hashcat: 1500 },
    ],
  },
  {
    regex: /^[a-f0-9]{16}$/i,
    modes: [
      { name: "MySQL323", hashcat: 200 },
      { name: "Half MD5", hashcat: 5100 },
      { name: "FNV-164", hashcat: null },
      { name: "CRC-64", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{16}:[a-f0-9]{0,30}$/i,
    modes: [
      { name: "Oracle H: Type (Oracle 7+), DES(Oracle)", hashcat: 3100 },
    ],
  },
  {
    regex: /^[a-z0-9\/.]{16}$/i,
    modes: [
      { name: "Cisco-PIX(MD5)", hashcat: 2400 },
    ],
  },
  {
    regex: /^\([a-z0-9\/+]{20}\)$/i,
    modes: [
      { name: "Lotus Notes/Domino 6", hashcat: 8700 },
    ],
  },
  {
    regex: /^_[a-z0-9\/.]{19}$/i,
    modes: [
      { name: "BSDi Crypt", hashcat: 12400 },
    ],
  },
  {
    regex: /^[a-f0-9]{24}$/i,
    modes: [
      { name: "CRC-96(ZIP)", hashcat: null },
      { name: "PKZIP Master Key", hashcat: 20500 },
      { name: "PKZIP Master Key (6 byte optimization)", hashcat: 20510 },
    ],
  },
  {
    regex: /^\$keepass\$\*1\*50000\*(0|1)\*([a-f0-9]{32})\*([a-f0-9]{64})\*([a-f0-9]{32})\*([a-f0-9]{64})\*1\*(192|1360)\*([a-f0-9]{384})$/,
    modes: [
      { name: "Keepass 1 AES / without keyfile", hashcat: 13400 },
    ],
  },
  {
    regex: /^\$keepass\$\*1\*6000\*(0|1)\*([a-f0-9]{32})\*([a-f0-9]{64})\*([a-f0-9]{32})\*([a-f0-9]{64})\*1\*(192|1360)\*([a-f0-9]{2720})\*1\*64\*([a-f0-9]{64})$/,
    modes: [
      { name: "Keepass 1 Twofish / with keyfile", hashcat: 13400 },
    ],
  },
  {
    regex: /^\$keepass\$\*2\*6000\*222(\*[a-f0-9]{64}){2}(\*[a-f0-9]{32}){1}(\*[a-f0-9]{64}){2}\*1\*64(\*[a-f0-9]{64}){1}$/,
    modes: [
      { name: "Keepass 2 AES / with keyfile", hashcat: 13400 },
    ],
  },
  {
    regex: /^\$keepass\$\*2\*6000\*222\*(([a-f0-9]{32,64})(\*)?)+$/,
    modes: [
      { name: "Keepass 2 AES / without keyfile", hashcat: 13400 },
    ],
  },
  {
    regex: /^[a-z0-9\/.]{24}$/i,
    modes: [
      { name: "Crypt16", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{32}$/i,
    modes: [
      { name: "MD5", hashcat: 0, description: "Used for Linux Shadow files." },
      { name: "MD4", hashcat: 900 },
      { name: "Double MD5", hashcat: 2600 },
      { name: "Tiger-128", hashcat: null },
      { name: "Skein-256(128)", hashcat: null },
      { name: "Skein-512(128)", hashcat: null },
      { name: "Lotus Notes/Domino 5", hashcat: 8600 },
      { name: "md5(md5(md5($pass)))", hashcat: 3500, description: "Hashcat mode is only supported in hashcat-legacy." },
      { name: "md5(uppercase(md5($pass)))", hashcat: 4300 },
      { name: "md5(sha1($pass))", hashcat: 4400 },
      { name: "md5(utf16($pass))", hashcat: null },
      { name: "md4(utf16($pass))", hashcat: null },
      { name: "md5(md4($pass))", hashcat: null },
    ],
  },
  {
    regex: /^(?:\$haval\$)?[a-f0-9]{32,64}$/i,
    modes: [
      { name: "Haval-128", hashcat: null },
    ],
  },
  {
    regex: /^(?:\$ripemd\$)?[a-f0-9]{32,40}$/i,
    modes: [
      { name: "RIPEMD-128", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{16}$/i,
    modes: [
      { name: "LM", hashcat: 3000 },
    ],
  },
  {
    regex: /^(?:\$dynamic_39\$)?[a-f0-9]{32}\$[a-z0-9]{1,32}\$?[a-z0-9]{1,500}/i,
    modes: [
      { name: "net-md5", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:[a-z0-9]+$/i,
    modes: [
      { name: "Skype", hashcat: 23 },
      { name: "ZipMonster", hashcat: null },
      { name: "md5(md5(md5($pass)))", hashcat: 3500 },
      { name: "md5(uppercase(md5($pass)))", hashcat: 4300 },
      { name: "md5(sha1($pass))", hashcat: 4400 },
      { name: "md5($pass.$salt)", hashcat: 10 },
      { name: "md5($salt.$pass)", hashcat: 20 },
      { name: "md5(unicode($pass).$salt)", hashcat: 30 },
      { name: "md5($salt.unicode($pass))", hashcat: 40 },
      { name: "HMAC-MD5 (key = $pass)", hashcat: 50 },
      { name: "HMAC-MD5 (key = $salt)", hashcat: 60 },
      { name: "md5(md5($salt).$pass)", hashcat: 3610, description: "Hashcat mode is only supported in hashcat-legacy." },
      { name: "md5($salt.md5($pass))", hashcat: 3710 },
      { name: "md5($pass.md5($salt))", hashcat: 3720, description: "Hashcat mode is only supported in hashcat-legacy." },
      { name: "WebEdition CMS", hashcat: 3721, description: "Hashcat mode is only supported in hashcat-legacy." },
      { name: "md5($username.0.$pass)", hashcat: 4210, description: "Hashcat mode is only supported in hashcat-legacy." },
      { name: "md5($salt.$pass.$salt)", hashcat: 3800 },
      { name: "md5(md5($pass).md5($salt))", hashcat: 3910 },
      { name: "md5($salt.md5($salt.$pass))", hashcat: 4010 },
      { name: "md5($salt.md5($pass.$salt))", hashcat: 4110 },
      { name: "md4($salt.$pass)", hashcat: null },
      { name: "md4($pass.$salt)", hashcat: null },
      { name: "md5($salt.pad16($pass))", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:[a-z0-9]{56}$/i,
    modes: [
      { name: "PrestaShop", hashcat: 11000 },
    ],
  },
  {
    regex: /^(\$md2\$)?[a-f0-9]{32}$/i,
    modes: [
      { name: "MD2", hashcat: null },
    ],
  },
  {
    regex: /^(\$snefru\$)?[a-f0-9]{32}$/i,
    modes: [
      { name: "Snefru-128", hashcat: null },
    ],
  },
  {
    regex: /^(\$NT\$)?[a-f0-9]{32}$/i,
    modes: [
      { name: "NTLM", hashcat: 1000, description: "Often used in Windows Active Directory." },
    ],
  },
  {
    regex: /^([^\\\/:*?"<>|]{1,20}:)?[a-f0-9]{32}(:[^\\\/:*?"<>|]{1,20})?$/i,
    modes: [
      { name: "Domain Cached Credentials", hashcat: 1100 },
    ],
  },
  {
    regex: /^([^\\\/:*?"<>|]{1,20}:)?(\$DCC2\$10240#[^\\\/:*?"<>|]{1,20}#)?[a-f0-9]{32}$/i,
    modes: [
      { name: "Domain Cached Credentials 2", hashcat: 2100 },
    ],
  },
  {
    regex: /^{SHA}[a-z0-9\/+]{27}=$/i,
    modes: [
      { name: "SHA-1(Base64)", hashcat: 101 },
      { name: "Netscape LDAP SHA", hashcat: 101 },
    ],
  },
  {
    regex: /^\$1\$[a-z0-9\/.]{0,8}\$[a-z0-9\/.]{22}(:.*)?$/i,
    modes: [
      { name: "MD5 Crypt", hashcat: 500 },
      { name: "Cisco-IOS(MD5)", hashcat: 500 },
      { name: "FreeBSD MD5", hashcat: 500 },
    ],
  },
  {
    regex: /^0x[a-f0-9]{32}$/i,
    modes: [
      { name: "Lineage II C4", hashcat: null },
    ],
  },
  {
    regex: /^\$H\$[a-z0-9\/.]{31}$/i,
    modes: [
      { name: "phpBB v3.x", hashcat: 400 },
      { name: "Wordpress v2.6.0/2.6.1", hashcat: 400 },
      { name: "PHPass' Portable Hash", hashcat: 400 },
    ],
  },
  {
    regex: /^\$P\$[a-z0-9\/.]{31}$/i,
    modes: [
      { name: "Wordpress ≥ v2.6.2", hashcat: 400 },
      { name: "Joomla ≥ v2.5.18", hashcat: 400 },
      { name: "PHPass' Portable Hash", hashcat: 400 },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:[a-z0-9]{2}$/i,
    modes: [
      { name: "osCommerce", hashcat: 21 },
      { name: "xt:Commerce", hashcat: 21 },
    ],
  },
  {
    regex: /^\$apr1\$[a-z0-9\/.]{0,8}\$[a-z0-9\/.]{22}$/i,
    modes: [
      { name: "MD5(APR)", hashcat: 1600 },
      { name: "Apache MD5", hashcat: 1600 },
      { name: "md5apr1", hashcat: 1600 },
    ],
  },
  {
    regex: /^{smd5}[a-z0-9$\/.]{31}$/i,
    modes: [
      { name: "AIX(smd5)", hashcat: 6300 },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:.{5}$/i,
    modes: [
      { name: "IP.Board ≥ v2+", hashcat: 2811 },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:.{8}$/i,
    modes: [
      { name: "MyBB ≥ v1.2+", hashcat: 2811 },
    ],
  },
  {
    regex: /^[a-z0-9]{34}$/i,
    modes: [
      { name: "CryptoCurrency(Adress)", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{40}(:.+)?$/i,
    modes: [
      { name: "SHA-1", hashcat: 100, description: "Used for checksums.", link: "https://en.wikipedia.org/wiki/SHA-1" },
      { name: "Double SHA-1", hashcat: 4500 },
      { name: "RIPEMD-160", hashcat: 6000 },
      { name: "Haval-160 (3 rounds)", hashcat: 6000 },
      { name: "Haval-160 (4 rounds)", hashcat: 6000 },
      { name: "Haval-160 (5 rounds)", hashcat: 6000 },
      { name: "Haval-192 (3 rounds)", hashcat: 6000 },
      { name: "Haval-192 (4 rounds)", hashcat: 6000 },
      { name: "Haval-192 (5 rounds)", hashcat: 6000 },
      { name: "Haval-224 (4 rounds)", hashcat: 6000 },
      { name: "Haval-224 (5 rounds)", hashcat: 6000 },
      { name: "Haval-160", hashcat: null },
      { name: "Tiger-160", hashcat: null },
      { name: "HAS-160", hashcat: null },
      { name: "LinkedIn", hashcat: 190, description: "Hashcat mode is only supported in oclHashcat." },
      { name: "Skein-256(160)", hashcat: null },
      { name: "Skein-512(160)", hashcat: null },
      { name: "MangosWeb Enhanced CMS", hashcat: null },
      { name: "sha1(sha1(sha1($pass)))", hashcat: 4600, description: "Hashcat mode is only supported in hashcat-legacy." },
      { name: "sha1(md5($pass))", hashcat: 4700 },
      { name: "sha1($pass.$salt)", hashcat: 110 },
      { name: "sha1($salt.$pass)", hashcat: 120 },
      { name: "sha1(unicode($pass).$salt)", hashcat: 130 },
      { name: "sha1($salt.unicode($pass))", hashcat: 140 },
      { name: "HMAC-SHA1 (key = $pass)", hashcat: 150 },
      { name: "HMAC-SHA1 (key = $salt)", hashcat: 160 },
      { name: "sha1($salt.$pass.$salt)", hashcat: 4710 },
    ],
  },
  {
    regex: /^[a-f0-9]{40}$/i,
    modes: [
      { name: "MySQL5.x", hashcat: 300 },
      { name: "MySQL4.1", hashcat: 300 },
    ],
  },
  {
    regex: /^[a-z0-9]{43}$/i,
    modes: [
      { name: "Cisco-IOS(SHA-256)", hashcat: 5700 },
    ],
  },
  {
    regex: /^{SSHA}[a-z0-9\/+]{38}==$/i,
    modes: [
      { name: "SSHA-1(Base64)", hashcat: 111 },
      { name: "Netscape LDAP SSHA", hashcat: 111 },
      { name: "nsldaps", hashcat: 111 },
    ],
  },
  {
    regex: /^[a-z0-9=]{47}$/i,
    modes: [
      { name: "Fortigate(FortiOS)", hashcat: 7000 },
    ],
  },
  {
    regex: /^[a-f0-9]{48}$/i,
    modes: [
      { name: "Haval-192", hashcat: null },
      { name: "Tiger-192", hashcat: null },
      { name: "SHA-1(Oracle)", hashcat: null },
      { name: "OSX v10.4", hashcat: 122 },
      { name: "OSX v10.5", hashcat: 122 },
      { name: "OSX v10.6", hashcat: 122 },
    ],
  },
  {
    regex: /^[a-f0-9]{51}$/i,
    modes: [
      { name: "Palshop CMS", hashcat: null },
    ],
  },
  {
    regex: /^[a-z0-9]{51}$/i,
    modes: [
      { name: "CryptoCurrency(PrivateKey)", hashcat: null },
    ],
  },
  {
    regex: /^{ssha1}[0-9]{2}\$[a-z0-9$\/.]{44}$/i,
    modes: [
      { name: "AIX(ssha1)", hashcat: 6700 },
    ],
  },
  {
    regex: /^0x0100[a-f0-9]{48}$/i,
    modes: [
      { name: "MSSQL(2005)", hashcat: 132 },
      { name: "MSSQL(2008)", hashcat: 132 },
    ],
  },
  {
    regex: /^(\$md5,rounds=[0-9]+\$|\$md5\$rounds=[0-9]+\$|\$md5\$)[a-z0-9\/.]{0,16}(\$|\$\$)[a-z0-9\/.]{22}$/i,
    modes: [
      { name: "Sun MD5 Crypt", hashcat: 3300, description: "Hashcat mode is only supported in hashcat-legacy." },
    ],
  },
  {
    regex: /^[a-f0-9]{56}$/i,
    modes: [
      { name: "SHA-224", hashcat: 1300 },
      { name: "sha224($salt.$pass)", hashcat: null },
      { name: "sha224($pass.$salt))", hashcat: null },
      { name: "sha224(sha224($pass))", hashcat: null },
      { name: "sha224(sha224_raw($pass))", hashcat: null },
      { name: "sha224(sha224($pass).$salt)", hashcat: null },
      { name: "sha224($salt.sha224($pass))", hashcat: null },
      { name: "sha224(sha224($salt).sha224($pass))", hashcat: null },
      { name: "sha224(sha224($pass).sha224($pass))", hashcat: null },
      { name: "Haval-224", hashcat: null },
      { name: "SHA3-224", hashcat: 17300 },
      { name: "Skein-256(224)", hashcat: null },
      { name: "Skein-512(224)", hashcat: null },
      { name: "Skein-224", hashcat: null },
      { name: "Keccak-224", hashcat: 17700 },
    ],
  },
  {
    regex: /^(\$2[abxy]?|\$2)\$[0-9]{2}\$[a-z0-9\/.]{53}$/i,
    modes: [
      { name: "Blowfish(OpenBSD)", hashcat: 3200, description: "Can be used in Linux Shadow Files." },
      { name: "Woltlab Burning Board 4.x", hashcat: null },
      { name: "bcrypt", hashcat: 3200 },
    ],
  },
  {
    regex: /^\$y\$[.\/A-Za-z0-9]+\$[.\/a-zA-Z0-9]+\$[.\/A-Za-z0-9]{43}$/i,
    modes: [
      { name: "yescrypt", hashcat: null, description: "Can be used in Linux Shadow Files in modern Linux distributions like Ubuntu 22.04, Debian 11, Fedora 35. On hashcat this is not yet implemented, please vote (👍 \"thumbs up\") on this issue: https://github.com/hashcat/hashcat/issues/2816." },
    ],
  },
  {
    regex: /^[a-f0-9]{40}:[a-f0-9]{16}$/i,
    modes: [
      { name: "Android PIN", hashcat: 5800 },
    ],
  },
  {
    regex: /^(S:)?[a-f0-9]{40}(:)?[a-f0-9]{20}$/i,
    modes: [
      { name: "Oracle 11g/12c", hashcat: 112 },
    ],
  },
  {
    regex: /^\$bcrypt-sha256\$(2[axy]|2)\,[0-9]+\$[a-z0-9\/.]{22}\$[a-z0-9\/.]{31}$/i,
    modes: [
      { name: "bcrypt(SHA-256)", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:.{3}$/i,
    modes: [
      { name: "vBulletin < v3.8.5", hashcat: 2611 },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:.{30}$/i,
    modes: [
      { name: "vBulletin ≥ v3.8.5", hashcat: 2711 },
    ],
  },
  {
    regex: /^(\$snefru\$)?[a-f0-9]{64}$/i,
    modes: [
      { name: "Snefru-256", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{64}(:.+)?$/i,
    modes: [
      { name: "SHA-256", hashcat: 1400, description: "256-bit key and is a good partner-function for AES. Can be used in Shadow files." },
      { name: "RIPEMD-256", hashcat: null },
      { name: "Haval-256 (3 rounds)", hashcat: null },
      { name: "Haval-256 (4 rounds)", hashcat: null },
      { name: "Haval-256 (5 rounds)", hashcat: null },
      { name: "GOST R 34.11-94", hashcat: 6900 },
      { name: "GOST CryptoPro S-Box", hashcat: null },
      { name: "Blake2b-256", hashcat: null },
      { name: "SHA3-256", hashcat: 17400 },
      { name: "PANAMA", hashcat: null },
      { name: "BLAKE2-256", hashcat: null },
      { name: "BLAKE2-384", hashcat: null },
      { name: "Skein-256", hashcat: null },
      { name: "Skein-512(256)", hashcat: null },
      { name: "Ventrilo", hashcat: null },
      { name: "sha256($pass.$salt)", hashcat: 1410 },
      { name: "sha256($salt.$pass)", hashcat: 1420 },
      { name: "sha256(sha256($pass))", hashcat: 1420 },
      { name: "sha256(sha256_raw($pass)))", hashcat: 1420 },
      { name: "sha256(sha256($pass).$salt)", hashcat: 1420 },
      { name: "sha256($salt.sha256($pass))", hashcat: 1420 },
      { name: "sha256(sha256($salt).sha256($pass))", hashcat: 1420 },
      { name: "sha256(sha256($pass).sha256($pass))", hashcat: 1420 },
      { name: "sha256(unicode($pass).$salt)", hashcat: 1430 },
      { name: "sha256($salt.unicode($pass))", hashcat: 1440 },
      { name: "HMAC-SHA256 (key = $pass)", hashcat: 1450 },
      { name: "HMAC-SHA256 (key = $salt)", hashcat: 1460 },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:[a-z0-9]{32}$/i,
    modes: [
      { name: "Joomla < v2.5.18", hashcat: 11 },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:[a-f0-9]{32}$/i,
    modes: [
      { name: "SAM(LM_Hash:NT_Hash)", hashcat: null },
    ],
  },
  {
    regex: /^(\$chap\$0\*)?[a-f0-9]{32}[\*:][a-f0-9]{32}(:[0-9]{2})?$/i,
    modes: [
      { name: "MD5(Chap)", hashcat: 4800 },
      { name: "iSCSI CHAP Authentication", hashcat: 4800 },
    ],
  },
  {
    regex: /^\$episerver\$\*0\*[a-z0-9\/=+]+\*[a-z0-9\/=+]{27,28}$/i,
    modes: [
      { name: "EPiServer 6.x < v4", hashcat: 141 },
    ],
  },
  {
    regex: /^{ssha256}[0-9]{2}\$[a-z0-9$\/.]{60}$/i,
    modes: [
      { name: "AIX(ssha256)", hashcat: 6400 },
    ],
  },
  {
    regex: /^[a-f0-9]{80}$/i,
    modes: [
      { name: "RIPEMD-320", hashcat: null },
    ],
  },
  {
    regex: /^\$episerver\$\*1\*[a-z0-9\/=+]+\*[a-z0-9\/=+]{42,43}$/i,
    modes: [
      { name: "EPiServer 6.x ≥ v4", hashcat: 1441 },
    ],
  },
  {
    regex: /^0x0100[a-f0-9]{88}$/i,
    modes: [
      { name: "MSSQL(2000)", hashcat: 131 },
    ],
  },
  {
    regex: /^[a-f0-9]{96}$/i,
    modes: [
      { name: "SHA-384", hashcat: 10800 },
      { name: "SHA3-384", hashcat: null },
      { name: "Skein-512(384)", hashcat: null },
      { name: "Skein-1024(384)", hashcat: null },
      { name: "sha384($salt.$pass)", hashcat: null },
      { name: "sha384($pass.$salt)", hashcat: null },
      { name: "sha384(sha384($pass))", hashcat: null },
      { name: "sha384(sha384_raw($pass))", hashcat: null },
      { name: "sha384(sha384($pass).$salt)", hashcat: null },
      { name: "sha384($salt.sha384($pass))", hashcat: null },
      { name: "sha384(sha384($salt).sha384($pass))", hashcat: null },
      { name: "sha384(sha384($pass).sha384($pass))", hashcat: null },
      { name: "Skein-384", hashcat: null },
    ],
  },
  {
    regex: /^{SSHA512}[a-z0-9\/+]{96}$/i,
    modes: [
      { name: "SSHA-512(Base64)", hashcat: 1711 },
      { name: "LDAP(SSHA-512)", hashcat: 1711 },
    ],
  },
  {
    regex: /^{ssha512}[0-9]{2}\$[a-z0-9\/.]{16,48}\$[a-z0-9\/.]{86}$/i,
    modes: [
      { name: "AIX(ssha512)", hashcat: 6500 },
    ],
  },
  {
    regex: /^[a-f0-9]{128}(:.+)?$/i,
    modes: [
      { name: "SHA-512", hashcat: 1700, description: "Used in Bitcoin Blockchain and Shadow Files." },
      { name: "Keccak-512", hashcat: 1800 },
      { name: "Whirlpool", hashcat: 6100 },
      { name: "Salsa10", hashcat: null, description: "Not considered a hash function.", link: "https://bugs.php.net/bug.php?id=60783" },
      { name: "Salsa20", hashcat: null, description: "Not considered a hash function.", link: "https://bugs.php.net/bug.php?id=60783" },
      { name: "Blake2", hashcat: 600, description: "Used in Wireguard, Zcash, IPFS and more.", link: "https://en.wikipedia.org/wiki/BLAKE_(hash_function)#Users_of_BLAKE2" },
      { name: "SHA3-512", hashcat: 17600 },
      { name: "Skein-512", hashcat: null },
      { name: "Skein-1024(512)", hashcat: null },
      { name: "sha512($pass.$salt)", hashcat: 1710 },
      { name: "sha512($salt.$pass)", hashcat: 1720 },
      { name: "sha512(unicode($pass).$salt)", hashcat: 1730 },
      { name: "sha512($salt.unicode($pass))", hashcat: 1740 },
      { name: "HMAC-SHA512 (key = $pass)", hashcat: 1750 },
      { name: "BLAKE2-224", hashcat: null },
      { name: "HMAC-SHA512 (key = $salt)", hashcat: 1760 },
    ],
  },
  {
    regex: /^[a-f0-9]{64}$/i,
    modes: [
      { name: "Keccak-256", hashcat: 17800 },
    ],
  },
  {
    regex: /^[a-f0-9]{96}$/i,
    modes: [
      { name: "Keccak-384", hashcat: 17900 },
    ],
  },
  {
    regex: /^[a-f0-9]{136}$/i,
    modes: [
      { name: "OSX v10.7", hashcat: 1722 },
    ],
  },
  {
    regex: /^0x0200[a-f0-9]{136}$/i,
    modes: [
      { name: "MSSQL(2012)", hashcat: 1731 },
      { name: "MSSQL(2014)", hashcat: 1731 },
    ],
  },
  {
    regex: /^\$ml\$[0-9]+\$[a-f0-9]{64}\$[a-f0-9]{128}$/i,
    modes: [
      { name: "OSX v10.8", hashcat: 7100 },
      { name: "OSX v10.9", hashcat: 7100 },
    ],
  },
  {
    regex: /^[a-f0-9]{256}$/i,
    modes: [
      { name: "Skein-1024", hashcat: null },
    ],
  },
  {
    regex: /^grub\.pbkdf2\.sha512\.[0-9]+\.([a-f0-9]{128,2048}\.|[0-9]+\.)?[a-f0-9]{128}$/i,
    modes: [
      { name: "GRUB 2", hashcat: 7200 },
    ],
  },
  {
    regex: /^sha1\$[a-z0-9]+\$[a-f0-9]{40}$/i,
    modes: [
      { name: "Django(SHA-1)", hashcat: 124 },
    ],
  },
  {
    regex: /^[a-f0-9]{49}$/i,
    modes: [
      { name: "Citrix Netscaler", hashcat: 8100 },
    ],
  },
  {
    regex: /^\$S\$[a-z0-9\/.]{52}$/i,
    modes: [
      { name: "Drupal > v7.x", hashcat: 7900 },
    ],
  },
  {
    regex: /^\$5\$(rounds=[0-9]+\$)?[a-z0-9\/.]{0,16}\$[a-z0-9\/.]{43}$/i,
    modes: [
      { name: "SHA-256 Crypt", hashcat: 7400 },
    ],
  },
  {
    regex: /^0x[a-f0-9]{4}[a-f0-9]{16}[a-f0-9]{64}$/i,
    modes: [
      { name: "Sybase ASE", hashcat: 8000 },
    ],
  },
  {
    regex: /^\$6\$(rounds=[0-9]+\$)?[a-z0-9\/.]{0,16}\$[a-z0-9\/.]{86}$/i,
    modes: [
      { name: "SHA-512 Crypt", hashcat: 1800 },
    ],
  },
  {
    regex: /^\$sha\$[a-z0-9]{1,16}\$([a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64}|[a-f0-9]{128}|[a-f0-9]{140})$/i,
    modes: [
      { name: "Minecraft(AuthMe Reloaded)", hashcat: 20711 },
    ],
  },
  {
    regex: /^sha256\$[a-z0-9]+\$[a-f0-9]{64}$/i,
    modes: [
      { name: "Django(SHA-256)", hashcat: null },
    ],
  },
  {
    regex: /^sha384\$[a-z0-9]+\$[a-f0-9]{96}$/i,
    modes: [
      { name: "Django(SHA-384)", hashcat: null },
    ],
  },
  {
    regex: /^crypt1:[a-z0-9+=]{12}:[a-z0-9+=]{12}$/i,
    modes: [
      { name: "Clavister Secure Gateway", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{112}$/i,
    modes: [
      { name: "Cisco VPN Client(PCF-File)", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{1329}$/i,
    modes: [
      { name: "Microsoft MSTSC(RDP-File)", hashcat: null },
    ],
  },
  {
    regex: /^[^\\\/:*?"<>|]{1,20}[:]{2,3}([^\\\/:*?"<>|]{1,20})?:[a-f0-9]{48}:[a-f0-9]{48}:[a-f0-9]{16}$/i,
    modes: [
      { name: "NetNTLMv1-VANILLA / NetNTLMv1+ESS", hashcat: 5500 },
    ],
  },
  {
    regex: /^([^\\\/:*?"<>|]{1,20}\\)?[^\\\/:*?"<>|]{1,20}[:]{2,3}([^\\\/:*?"<>|]{1,20}:)?[^\\\/:*?"<>|]{1,20}:[a-f0-9]{32}:[a-f0-9]+$/i,
    modes: [
      { name: "NetNTLMv2", hashcat: 5600 },
    ],
  },
  {
    regex: /^\$(krb5pa|mskrb5)\$(23)?\$.+\$[a-f0-9]{1,}$/i,
    modes: [
      { name: "Kerberos 5 AS-REQ Pre-Auth", hashcat: 7500 },
    ],
  },
  {
    regex: /^\$scram\$[0-9]+\$[a-z0-9\/.]{16}\$sha-1=[a-z0-9\/.]{27},sha-256=[a-z0-9\/.]{43},sha-512=[a-z0-9\/.]{86}$/i,
    modes: [
      { name: "SCRAM Hash", hashcat: null },
    ],
  },
  {
    regex: /^[a-f0-9]{40}:[a-f0-9]{0,32}$/i,
    modes: [
      { name: "Redmine Project Management Web App", hashcat: 4521 },
    ],
  },
  {
    regex: /^([^$]+)?\$[a-f0-9]{16}$/i,
    modes: [
      { name: "SAP CODVN B (BCODE)", hashcat: 7700 },
    ],
  },
  {
    regex: /^(.+)?\$[a-f0-9]{40}$/i,
    modes: [
      { name: "SAP CODVN F/G (PASSCODE)", hashcat: 7800 },
    ],
  },
  {
    regex: /^(.+\$)?[a-z0-9\/.+]{30}(:.+)?$/i,
    modes: [
      { name: "Juniper Netscreen/SSG(ScreenOS)", hashcat: 22 },
    ],
  },
  {
    regex: /^0x(?:[a-f0-9]{60}|[a-f0-9]{40})$/i,
    modes: [
      { name: "EPi", hashcat: 123, description: "Hashcat mode is no longer supported." },
    ],
  },
  {
    regex: /^[a-f0-9]{40}:[^*]{1,25}$/i,
    modes: [
      { name: "SMF ≥ v1.1", hashcat: 121 },
    ],
  },
  {
    regex: /^(\$wbb3\$\*1\*)?[a-f0-9]{40}[:*][a-f0-9]{40}$/i,
    modes: [
      { name: "Woltlab Burning Board 3.x", hashcat: 8400 },
    ],
  },
  {
    regex: /^[a-f0-9]{130}(:[a-f0-9]{40})?$/i,
    modes: [
      { name: "IPMI2 RAKP HMAC-SHA1", hashcat: 7300 },
    ],
  },
  {
    regex: /^[a-f0-9]{32}:[0-9]+:[a-z0-9_.+-]+@[a-z0-9-]+\.[a-z0-9-.]+$/i,
    modes: [
      { name: "Lastpass", hashcat: 6800 },
    ],
  },
  {
    regex: /^[a-z0-9\/.]{16}([:$].{1,})?$/i,
    modes: [
      { name: "Cisco-ASA(MD5)", hashcat: 2410 },
    ],
  },
  {
    regex: /^\$vnc\$\*[a-f0-9]{32}\*[a-f0-9]{32}$/i,
    modes: [
      { name: "VNC", hashcat: null },
    ],
  },
  {
    regex: /^[a-z0-9]{32}(:([a-z0-9-]+\.)?[a-z0-9-.]+\.[a-z]{2,7}:.+:[0-9]+)?$/i,
    modes: [
      { name: "DNSSEC(NSEC3)", hashcat: 8300 },
    ],
  },
  {
    regex: /^(user-.+:)?\$racf\$\*.+\*[a-f0-9]{16}$/i,
    modes: [
      { name: "RACF", hashcat: 8500 },
    ],
  },
  {
    regex: /^\$3\$\$[a-f0-9]{32}$/i,
    modes: [
      { name: "NTHash(FreeBSD Variant)", hashcat: null },
    ],
  },
  {
    regex: /^\$sha1\$[0-9]+\$[a-z0-9\/.]{0,64}\$[a-z0-9\/.]{28}$/i,
    modes: [
      { name: "SHA-1 Crypt", hashcat: 15100 },
    ],
  },
  {
    regex: /^[a-f0-9]{70}$/i,
    modes: [
      { name: "hMailServer", hashcat: 1421 },
    ],
  },
  {
    regex: /^[:\$][AB][:\$]([a-f0-9]{1,8}[:\$])?[a-f0-9]{32}$/i,
    modes: [
      { name: "MediaWiki", hashcat: 3711 },
    ],
  },
  {
    regex: /^[a-f0-9]{140}$/i,
    modes: [
      { name: "Minecraft(xAuth)", hashcat: null },
    ],
  },
  {
    regex: /^\$pbkdf2(-sha1)?\$[0-9]+\$[a-z0-9\/.]+\$[a-z0-9\/.]{27}$/i,
    modes: [
      { name: "PBKDF2-SHA1(Generic)", hashcat: 20400 },
    ],
  },
  {
    regex: /^\$pbkdf2-sha256\$[0-9]+\$[a-z0-9\/.]+\$[a-z0-9\/.]{43}$/i,
    modes: [
      { name: "PBKDF2-SHA256(Generic)", hashcat: 20300 },
    ],
  },
  {
    regex: /^\$pbkdf2-sha512\$[0-9]+\$[a-z0-9\/.]+\$[a-z0-9\/.]{86}$/i,
    modes: [
      { name: "PBKDF2-SHA512(Generic)", hashcat: 20200 },
    ],
  },
  {
    regex: /^\$p5k2\$[0-9]+\$[a-z0-9\/+=-]+\$[a-z0-9\/+-]{27}=$/i,
    modes: [
      { name: "PBKDF2(Cryptacular)", hashcat: null },
    ],
  },
  {
    regex: /^\$p5k2\$[0-9]+\$[a-z0-9\/.]+\$[a-z0-9\/.]{32}$/i,
    modes: [
      { name: "PBKDF2(Dwayne Litzenberger)", hashcat: null },
    ],
  },
  {
    regex: /^{FSHP[0123]\|[0-9]+\|[0-9]+}[a-z0-9\/+=]+$/i,
    modes: [
      { name: "Fairly Secure Hashed Password", hashcat: null },
    ],
  },
  {
    regex: /^\$PHPS\$.+\$[a-f0-9]{32}$/i,
    modes: [
      { name: "PHPS", hashcat: 2612 },
    ],
  },
  {
    regex: /^[0-9]{4}:[a-f0-9]{16}:[a-f0-9]{2080}$/i,
    modes: [
      { name: "1Password(Agile Keychain)", hashcat: 6600 },
    ],
  },
  {
    regex: /^[a-f0-9]{64}:[a-f0-9]{32}:[0-9]{5}:[a-f0-9]{608}$/i,
    modes: [
      { name: "1Password(Cloud Keychain)", hashcat: 8200 },
    ],
  },
  {
    regex: /^[a-f0-9]{256}:[a-f0-9]{256}:[a-f0-9]{16}:[a-f0-9]{16}:[a-f0-9]{320}:[a-f0-9]{16}:[a-f0-9]{40}:[a-f0-9]{40}:[a-f0-9]{32}$/i,
    modes: [
      { name: "IKE-PSK MD5", hashcat: 5300 },
    ],
  },
  {
    regex: /^[a-f0-9]{256}:[a-f0-9]{256}:[a-f0-9]{16}:[a-f0-9]{16}:[a-f0-9]{320}:[a-f0-9]{16}:[a-f0-9]{40}:[a-f0-9]{40}:[a-f0-9]{40}$/i,
    modes: [
      { name: "IKE-PSK SHA1", hashcat: 5400 },
    ],
  },
  {
    regex: /^[a-z0-9\/+]{27}=$/i,
    modes: [
      { name: "PeopleSoft", hashcat: 133 },
    ],
  },
  {
    regex: /^crypt\$[a-f0-9]{5}\$[a-z0-9\/.]{13}$/i,
    modes: [
      { name: "Django(DES Crypt Wrapper)", hashcat: null },
    ],
  },
  {
    regex: /^(\$django\$\*1\*)?pbkdf2_sha256\$[0-9]+\$[a-z0-9]+\$[a-z0-9\/+=]{44}$/i,
    modes: [
      { name: "Django(PBKDF2-HMAC-SHA256)", hashcat: 10000 },
    ],
  },
  {
    regex: /^pbkdf2_sha1\$[0-9]+\$[a-z0-9]+\$[a-z0-9\/+=]{28}$/i,
    modes: [
      { name: "Django(PBKDF2-HMAC-SHA1)", hashcat: null },
    ],
  },
  {
    regex: /^bcrypt(\$2[axy]|\$2)\$[0-9]{2}\$[a-z0-9\/.]{53}$/i,
    modes: [
      { name: "Django(bcrypt)", hashcat: null },
    ],
  },
  {
    regex: /^md5\$[a-f0-9]+\$[a-f0-9]{32}$/i,
    modes: [
      { name: "Django(MD5)", hashcat: null },
    ],
  },
  {
    regex: /^\{PKCS5S2\}[a-z0-9\/+]{64}$/i,
    modes: [
      { name: "PBKDF2(Atlassian)", hashcat: null },
    ],
  },
  {
    regex: /^md5[a-f0-9]{32}$/i,
    modes: [
      { name: "PostgreSQL MD5", hashcat: null },
    ],
  },
  {
    regex: /^\([a-z0-9\/+]{49}\)$/i,
    modes: [
      { name: "Lotus Notes/Domino 8", hashcat: 9100 },
    ],
  },
  {
    regex: /^SCRYPT:[0-9]{1,}:[0-9]{1}:[0-9]{1}:[a-z0-9:\/+=]{1,}$/i,
    modes: [
      { name: "scrypt", hashcat: 8900, description: "Used in Dogecoin and Litecoin." },
    ],
  },
  {
    regex: /^\$8\$[a-z0-9\/.]{14}\$[a-z0-9\/.]{43}$/i,
    modes: [
      { name: "Cisco Type 8", hashcat: 9200 },
    ],
  },
  {
    regex: /^\$9\$[a-z0-9\/.]{14}\$[a-z0-9\/.]{43}$/i,
    modes: [
      { name: "Cisco Type 9", hashcat: 9300 },
    ],
  },
  {
    regex: /^\$office\$\*2007\*[0-9]{2}\*[0-9]{3}\*[0-9]{2}\*[a-z0-9]{32}\*[a-z0-9]{32}\*[a-z0-9]{40}$/i,
    modes: [
      { name: "Microsoft Office 2007", hashcat: 9400 },
    ],
  },
  {
    regex: /^\$office\$\*2010\*[0-9]{6}\*[0-9]{3}\*[0-9]{2}\*[a-z0-9]{32}\*[a-z0-9]{32}\*[a-z0-9]{64}$/i,
    modes: [
      { name: "Microsoft Office 2010", hashcat: 9500 },
    ],
  },
  {
    regex: /^\\$office\\$2016\\$[0-9]\\$[0-9]{6}\\$[^$]{24}\\$[^$]{88}$/i,
    modes: [
      { name: "Microsoft Office 2016 - SheetProtection", hashcat: 25300 },
    ],
  },
  {
    regex: /^\$office\$\*2013\*[0-9]{6}\*[0-9]{3}\*[0-9]{2}\*[a-z0-9]{32}\*[a-z0-9]{32}\*[a-z0-9]{64}$/i,
    modes: [
      { name: "Microsoft Office 2013", hashcat: 9600 },
    ],
  },
  {
    regex: /^\$fde\$[0-9]{2}\$[a-f0-9]{32}\$[0-9]{2}\$[a-f0-9]{32}\$[a-f0-9]{3072}$/i,
    modes: [
      { name: "Android FDE ≤ 4.3", hashcat: 8800 },
    ],
  },
  {
    regex: /^\$krb5tgs\$23\$\*[^*]*\*\$[a-f0-9]{32}\$[a-f0-9]{64,40960}/i,
    modes: [
      { name: "Kerberos 5 TGS-REP etype 23", hashcat: 13100, description: "Used in Windows Active Directory." },
    ],
  },
  {
    regex: /^\$oldoffice\$[01]\*[a-f0-9]{32}\*[a-f0-9]{32}\*[a-f0-9]{32}$/i,
    modes: [
      { name: "Microsoft Office ≤ 2003 (MD5+RC4)", hashcat: 9700 },
      { name: "Microsoft Office ≤ 2003 (MD5+RC4) collider-mode #1", hashcat: 9710 },
    ],
  },
  {
    regex: /^\$oldoffice\$[34]\*[a-f0-9]{32}\*[a-f0-9]{32}\*[a-f0-9]{40}$/i,
    modes: [
      { name: "Microsoft Office ≤ 2003 (SHA1+RC4)", hashcat: 9800 },
      { name: "Microsoft Office ≤ 2003 (SHA1+RC4) collider-mode #1", hashcat: 9810 },
    ],
  },
  {
    regex: /^\$oldoffice\$[34]\*[a-f0-9]{32}\*[a-f0-9]{32}\*[a-f0-9]{40}:[a-f0-9]{10}/i,
    modes: [
      { name: "MS Office ⇐ 2003 $3, SHA1 + RC4, collider #2", hashcat: 9820 },
    ],
  },
  {
    regex: /^(\$radmin2\$)?[a-f0-9]{32}$/i,
    modes: [
      { name: "RAdmin v2.x", hashcat: 9900 },
    ],
  },
  {
    regex: /^{x-issha,\s[0-9]{4}}[a-z0-9\/+=]+$/i,
    modes: [
      { name: "SAP CODVN H (PWDSALTEDHASH) iSSHA-1", hashcat: 10300 },
    ],
  },
  {
    regex: /^\$cram_md5\$[a-z0-9\/+=-]+\$[a-z0-9\/+=-]{52}$/i,
    modes: [
      { name: "CRAM-MD5", hashcat: 10200 },
    ],
  },
  {
    regex: /^[a-f0-9]{16}:2:4:[a-f0-9]{32}$/i,
    modes: [
      { name: "SipHash", hashcat: 10100 },
    ],
  },
  {
    regex: /^[a-f0-9]{4,}$/i,
    modes: [
      { name: "Cisco Type 7", hashcat: null },
    ],
  },
  {
    regex: /^[a-z0-9\/.]{13,}$/i,
    modes: [
      { name: "BigCrypt", hashcat: null },
    ],
  },
  {
    regex: /^(\$cisco4\$)?[a-z0-9\/.]{43}$/i,
    modes: [
      { name: "Cisco Type 4", hashcat: null },
    ],
  },
  {
    regex: /^bcrypt_sha256\$\$(2[axy]|2)\$[0-9]+\$[a-z0-9\/.]{53}$/i,
    modes: [
      { name: "Django(bcrypt-SHA256)", hashcat: null },
    ],
  },
  {
    regex: /^\$postgres\$.[^\*]+[*:][a-f0-9]{1,32}[*:][a-f0-9]{32}$/i,
    modes: [
      { name: "PostgreSQL Challenge-Response Authentication (MD5)", hashcat: 11100 },
    ],
  },
  {
    regex: /^\$siemens-s7\$[0-9]{1}\$[a-f0-9]{40}\$[a-f0-9]{40}$/i,
    modes: [
      { name: "Siemens-S7", hashcat: null },
    ],
  },
  {
    regex: /^(\$pst\$)?[a-f0-9]{8}$/i,
    modes: [
      { name: "Microsoft Outlook PST", hashcat: null },
    ],
  },
  {
    regex: /^sha256[:$][0-9]+[:$][a-z0-9\/+=]+[:$][a-z0-9\/+]{32,128}$/i,
    modes: [
      { name: "PBKDF2-HMAC-SHA256(PHP)", hashcat: 10900 },
    ],
  },
  {
    regex: /^(\$dahua\$)?[a-z0-9]{8}$/i,
    modes: [
      { name: "Dahua", hashcat: null },
    ],
  },
  {
    regex: /^\$mysqlna\$[a-f0-9]{40}[:*][a-f0-9]{40}$/i,
    modes: [
      { name: "MySQL Challenge-Response Authentication (SHA1)", hashcat: 11200 },
    ],
  },
  {
    regex: /^\$pdf\$1\*[2|3]\*[0-9]{2}\*[-0-9]{1,6}\*[0-9]\*[0-9]{2}\*[a-f0-9]{32,32}\*[0-9]{2}\*[a-f0-9]{64}\*[0-9]{2}\*[a-f0-9]{64}/i,
    modes: [
      { name: "PDF 1.1 - 1.3 (Acrobat 2 - 4)", hashcat: 10400 },
      { name: "PDF 1.1 - 1.3 (Acrobat 2 - 4), collider #1", hashcat: 10410 },
    ],
  },
  {
    regex: /^\$pdf\$1\*[2|3]\*[0-9]{2}\*[-0-9]{1,6}\*[0-9]\*[0-9]{2}\*[a-f0-9]{32}\*[0-9]{2}\*[a-f0-9]{64}\*[0-9]{2}\*[a-f0-9]{64}:[a-f0-9]{10}/i,
    modes: [
      { name: "PDF 1.1 - 1.3 (Acrobat 2 - 4), collider #2", hashcat: 10420 },
    ],
  },
  {
    regex: /^\$pdf\$[24]\*[34]\*128\*[0-9-]{1,5}\*1\*(16|32)\*[a-f0-9]{32,64}\*32\*[a-f0-9]{64}\*(8|16|32)\*[a-f0-9]{16,64}$/i,
    modes: [
      { name: "PDF 1.4 - 1.6 (Acrobat 5 - 8)", hashcat: 10500 },
    ],
  },
  {
    regex: /^\$pdf\$5\*[5|6]\*[0-9]{3}\*[-0-9]{1,6}\*[0-9]\*[0-9]{1,4}\*[a-f0-9]{0,1024}\*[0-9]{1,4}\*[a-f0-9]{0,1024}\*[0-9]{1,4}\*[a-f0-9]{0,1024}\*[0-9]{1,4}\*[a-f0-9]{0,1024}\*[0-9]{1,4}\*[a-f0-9]{0,1024}/i,
    modes: [
      { name: "PDF 1.7 Level 3 (Acrobat 9)", hashcat: 10600 },
    ],
  },
  {
    regex: /^\$pdf\$5\*[5|6]\*[0-9]{3}\*[-0-9]{1,6}\*[0-9]\*[0-9]{1,4}\*[a-f0-9]{0,1024}\*[0-9]{1,4}\*[a-f0-9]{0,1024}\*[0-9]{1,4}\*[a-f0-9]{0,1024}/i,
    modes: [
      { name: "PDF 1.7 Level 8 (Acrobat 10 - 11)", hashcat: 10700 },
    ],
  },
  {
    regex: /^\$krb5asrep\$23\$[^:]+:[a-f0-9]{32,32}\$[a-f0-9]{64,40960}$/i,
    modes: [
      { name: "Kerberos 5 AS-REP etype 23", hashcat: 18200, description: "Used for Windows Active Directory" },
    ],
  },
  {
    regex: /^\$krb5tgs\$17\$[^$]{1,512}\$[^$]{1,512}\$[^$]{1,4}?\$?[a-f0-9]{1,32}\$[a-f0-9]{64,40960}$/i,
    modes: [
      { name: "Kerberos 5 TGS-REP etype 17 (AES128-CTS-HMAC-SHA1-96)", hashcat: 19600, description: "Used for Windows Active Directory" },
    ],
  },
  {
    regex: /^\$krb5tgs\$18\$[^$]{1,512}\$[^$]{1,512}\$[^$]{1,4}?\$?[a-f0-9]{1,32}\$[a-f0-9]{64,40960}/i,
    modes: [
      { name: "Kerberos 5 TGS-REP etype 18 (AES256-CTS-HMAC-SHA1-96)", hashcat: 19700, description: "Used for Windows Active Directory" },
    ],
  },
  {
    regex: /^\$krb5pa\$17\$[^$]{1,512}\$[^$]{1,512}\$[a-f0-9]{104,112}$/i,
    modes: [
      { name: "Kerberos 5, etype 17, Pre-Auth", hashcat: 19800, description: "Used for Windows Active Directory" },
    ],
  },
  {
    regex: /^\$krb5pa\$17\$[^$]{1,512}\$[^$]{1,512}\$[^$]{0,512}\$[a-f0-9]{104,112}$/i,
    modes: [
      { name: "Kerberos 5, etype 17, Pre-Auth (with salt)", hashcat: null, description: "Used for Windows Active Directory" },
    ],
  },
  {
    regex: /^\$krb5pa\$18\$[^$]{1,512}\$[^$]{1,512}\$[^$]{0,512}\$[a-f0-9]{104,112}$/i,
    modes: [
      { name: "Kerberos 5, etype 18, Pre-Auth (with salt)", hashcat: null, description: "Used for Windows Active Directory" },
    ],
  },
  {
    regex: /^\$krb5pa\$18\$[^$]{1,512}\$[^$]{1,512}\$[a-f0-9]{104,112}$/i,
    modes: [
      { name: "Kerberos 5, etype 18, Pre-Auth", hashcat: 19900, description: "Used for Windows Active Directory" },
    ],
  },
  {
    regex: /^\$bitcoin\$[0-9]{2,4}\$[a-f0-9$]{250,350}/i,
    modes: [
      { name: "Bitcoin / Litecoin", hashcat: 11300, description: "Use Bitcoin2John.py to extract the hash for cracking." },
    ],
  },
  {
    regex: /^\$ethereum\$[a-z0-9*]{150,250}/i,
    modes: [
      { name: "Ethereum Wallet, PBKDF2-HMAC-SHA256", hashcat: 15600, description: "Use ethereum2john.py to crack." },
      { name: "Ethereum Pre-Sale Wallet, PBKDF2-HMAC-SHA256", hashcat: 16300, description: "Use ethereum2john.py to crack." },
    ],
  },
  {
    regex: /^\$monero\$(0)\*[a-f0-9]{32,3196}/i,
    modes: [
      { name: "Monero", hashcat: null, description: "Use monero2john.py to crack." },
    ],
  },
  {
    regex: /^\$electrum\$[1-3]\*[a-f0-9]{32,32}\*[a-f0-9]{32,32}$/i,
    modes: [
      { name: "Electrum Wallet (Salt-Type 1-3)", hashcat: 16600 },
    ],
  },
  {
    regex: /^\$electrum\$4\*[a-f0-9]{1,66}\*[a-f0-9]{128,32768}\*[a-f0-9]{64,64}$/i,
    modes: [
      { name: "Electrum Wallet (Salt-Type 4)", hashcat: 21700 },
    ],
  },
  {
    regex: /^\$electrum\$5\*[a-f0-9]{66,66}\*[a-f0-9]{2048,2048}\*[a-f0-9]{64,64}$/i,
    modes: [
      { name: "Electrum Wallet (Salt-Type 5)", hashcat: 21800 },
    ],
  },
  {
    regex: /^\$ab\$[0-9]{1}\*[0-9]{1}\*[0-9]{1,6}\*[a-f0-9]{128}\*[a-f0-9]{128}\*[a-f0-9]{32}\*[a-f0-9]{192}/i,
    modes: [
      { name: "Android Backup", hashcat: 18900 },
    ],
  },
  {
    regex: /^\$zip2\$\*[0-9]{1}\*[0-9]{1}\*[0-9]{1}\*[a-f0-9]{16,32}\*[a-f0-9]{1,6}\*[a-f0-9]{1,6}\*[a-f0-9]+\*[a-f0-9]{20}\*\$\/zip2\$/i,
    modes: [
      { name: "WinZip", hashcat: 13600 },
    ],
  },
  {
    regex: /^\$itunes_backup\$\*[0-9]{1,2}\*[a-f0-9]{80}\*[0-9]{1,6}\*[a-f0-9]{40}\*[0-9]{0,10}\*[a-f0-9]{0,40}/i,
    modes: [
      { name: "iTunes backup >= 10.0", hashcat: 14800 },
      { name: "iTunes backup < 10.0", hashcat: 14700 },
    ],
  },
  {
    regex: /^\$telegram\$[a-f0-9*]{99}/i,
    modes: [
      { name: "Telegram Mobile App Passcode (SHA256)", hashcat: 22301 },
    ],
  },
  {
    regex: /^\\$telegram\\$1\\*4000\\*[a-f0-9]{64}\\*[a-f0-9]{576}$/i,
    modes: [
      { name: "Telegram Desktop 1.3.9", hashcat: null },
    ],
  },
  {
    regex: /^\\$telegram\\$2\\*100000\\*[a-f0-9]{64}\\*[a-f0-9]{576}$/i,
    modes: [
      { name: "Telegram Desktop >= 2.1.14-beta / 2.2.0", hashcat: null },
    ],
  },
  {
    regex: /^\$BLAKE2\$[a-f0-9]{128}/i,
    modes: [
      { name: "BLAKE2b-512", hashcat: 600 },
    ],
  },
  {
    regex: /^\$oldoffice\$[a-f0-9*]{100}:[a-f0-9]{10}/i,
    modes: [
      { name: "MS Office ⇐ 2003 $0/$1, MD5 + RC4, collider #2", hashcat: 9720, description: "Use office2john.py to grab the hash." },
    ],
  },
  {
    regex: /^\$office\$2016\$[0-9]\$[0-9]{6}\$[^$]{24}\$[^$]{88}/i,
    modes: [
      { name: "MS Office 2016 - SheetProtection", hashcat: 25300 },
    ],
  },
  {
    regex: /^\$7z\$[0-9]\$[0-9]{1,2}\$[0-9]{1}\$[^$]{0,64}\$[0-9]{1,2}\$[a-f0-9]{32}\$[0-9]{1,10}\$[0-9]{1,6}\$[0-9]{1,6}\$[a-f0-9]{2,}/i,
    modes: [
      { name: "7-zip", hashcat: 11600 },
    ],
  },
  {
    regex: /^\$zip3\$\*[0-9]\*[0-9]\*256\*[0-9]\*[a-f0-9]{0,32}\*[a-f0-9]{288}\*[0-9]\*[0-9]\*[0-9]\*[^\s]{0,64}/i,
    modes: [
      { name: "SecureZIP AES-256", hashcat: 23003 },
    ],
  },
  {
    regex: /^\$zip3\$\*[0-9]\*[0-9]\*192\*[0-9]\*[a-f0-9]{0,32}\*[a-f0-9]{288}\*[0-9]\*[0-9]\*[0-9]\*[^\s]{0,64}/i,
    modes: [
      { name: "SecureZIP AES-192", hashcat: 23002 },
    ],
  },
  {
    regex: /^\$zip3\$\*[0-9]\*[0-9]\*128\*[0-9]\*[a-f0-9]{0,32}\*[a-f0-9]{288}\*[0-9]\*[0-9]\*[0-9]\*[^\s]{0,64}/i,
    modes: [
      { name: "SecureZIP AES-128", hashcat: 23001 },
    ],
  },
  {
    regex: /^\$pkzip2?\$(1)\*[0-9]{1}\*[0-9]{1}\*[0-9a-f]{1,3}\*[0-9a-f]{1,8}\*[0-9a-f]{1,4}\*[0-9a-f]{1,8}\*[0-9a-f]{1,8}\*[0-9a-f]{1,8}\*(8)\*[0-9a-f]{1,8}(\*[0-9a-f]{1,8})?\*[0-9a-f]{1,8}\*[a-f0-9]+\*\$\/pkzip2?\$$/i,
    modes: [
      { name: "PKZIP (Compressed)", hashcat: 17200 },
    ],
  },
  {
    regex: /^\$pkzip2?\$(1)\*[0-9]{1}\*[0-9]{1}\*[0-9a-f]{1,8}\*[0-9a-f]{1,8}\*[0-9a-f]{1,8}\*[0-9a-f]{1,8}\*[0-9a-f]{1,8}\*[0-9a-f]{1,8}\*(0)\*[0-9a-f]{1,8}(\*[0-9a-f]{1,8})?\*[0-9a-f]{1,8}\*[a-f0-9]+\*\$\/pkzip2?\$$/i,
    modes: [
      { name: "PKZIP (Uncompressed)", hashcat: 17210 },
    ],
  },
  {
    regex: /^\$pkzip2?\$([2-8])\*[0-9]{1}(\*[0-9]{1}\*[0-9a-f]{1,3}\*([^0*][0-9a-f]{0,2})\*[0-9a-f]{1,8}(\*[0-9a-f]{1,8})?\*[0-9a-f]{1,8}\*[0-9a-f]+)+\*(8)\*[0-9a-f]{1,8}(\*[0-9a-f]{1,8})?\*[0-9a-f]{1,8}\*[a-f0-9]+\*\$\/pkzip2?\$$/i,
    modes: [
      { name: "PKZIP (Compressed Multi-File)", hashcat: 17220 },
    ],
  },
  {
    regex: /^\$pkzip2?\$([2-8])\*[0-9]{1}(\*[0-9]{1}\*[0-9a-f]{1,8}\*([0-9a-f]{1,8})\*[0-9a-f]{1,8}(\*[0-9a-f]{1,8})?\*[0-9a-f]{1,8}\*[0-9a-f]+)+\*([08])\*[0-9a-f]{1,8}(\*[0-9a-f]{1,8})?\*[0-9a-f]{1,8}\*[a-f0-9]+\*\$\/pkzip2?\$$/i,
    modes: [
      { name: "PKZIP (Mixed Multi-File)", hashcat: 17225 },
    ],
  },
  {
    regex: /^\$pkzip2?\$([2-8])\*[0-9]{1}(\*[0-9]{1}\*[0-9a-f]{1,3}\*[0-9a-f]{1,8}\*[0-9a-f]{1,8}(\*[0-9a-f]{1,8})?\*[0-9a-f]{1,8}\*[0-9a-f]+)+\*\$\/pkzip2?\$$/i,
    modes: [
      { name: "PKZIP (Mixed Multi-File Checksum-Only)", hashcat: 17230 },
    ],
  },
  {
    regex: /^\$argon2i\$v=19\$m=[0-9]{1,6},t=[0-9]{1,2},p=[0-9]{1,2}\$[^$]+\$[^\s]{6,134}$/i,
    modes: [
      { name: "Argon2i", hashcat: null },
    ],
  },
  {
    regex: /^\$argon2id\$v=19\$m=[0-9]{1,6},t=[0-9]{1,2},p=[0-9]{1,2}\$[^$]+\$[^\s]{6,134}$/i,
    modes: [
      { name: "Argon2id", hashcat: null },
    ],
  },
  {
    regex: /^\$argon2d\$v=19\$m=[0-9]{1,6},t=[0-9]{1,2},p=[0-9]{1,2}\$[^$]+\$[^\s]{6,134}$/i,
    modes: [
      { name: "Argon2d", hashcat: null },
    ],
  },
  {
    regex: /^\$bitlocker\$[0-9]\$[0-9]{2}\$[a-f0-9]{32}\$[a-f0-9]{7}\$[a-f0-9]{2}\$[a-f0-9]{24}\$[a-f0-9]{2}\$[a-f0-9]{120}/i,
    modes: [
      { name: "BitLocker", hashcat: 22100 },
    ],
  },
  {
    regex: /^\$racf\$\*.{1,}\*[A-F0-9]{16}/i,
    modes: [
      { name: "RACF", hashcat: 8500 },
    ],
  },
  {
    regex: /^\$sshng\$4\$16\$[0-9]{32}\$1232\$[a-f0-9]{2464}$/i,
    modes: [
      { name: "RSA/DSA/EC/OpenSSH Private Keys ($4$)", hashcat: 22941 },
    ],
  },
  {
    regex: /^\$RAR3\$\*(1)\*[0-9a-f]{1,16}\*[0-9a-f]{1,8}\*[0-9a-f]{1,16}\*[0-9a-f]{1,16}\*[01]\*([0-9a-f]+|[^*]{1,64}\*[0-9a-f]{1,16})\*30$/i,
    modes: [
      { name: "RAR3-p (Uncompressed)", hashcat: 23700 },
    ],
  },
  {
    regex: /^\$RAR3\$\*(1)\*[0-9a-f]{1,16}\*[0-9a-f]{1,8}\*[0-9a-f]{1,16}\*[0-9a-f]{1,16}\*[01]\*([0-9a-f]+|[^*]{1,64}\*[0-9a-f]{1,16})\*(31|32|33|34|35)$/i,
    modes: [
      { name: "RAR3-p (Compressed)", hashcat: 23800 },
    ],
  },
  {
    regex: /^\$RAR3\$\*0\*[0-9a-f]{1,16}\*[0-9a-f]+$/i,
    modes: [
      { name: "RAR3-hp", hashcat: 12500 },
    ],
  },
  {
    regex: /^\$rar5\$[0-9a-f]{1,2}\$[0-9a-f]{1,32}\$[0-9a-f]{1,2}\$[0-9a-f]{1,32}\$[0-9a-f]{1,2}\$[0-9a-f]{1,16}$/i,
    modes: [
      { name: "RAR5", hashcat: 13000 },
    ],
  },
  {
    regex: /^\$keepass\$\*1\*\d+\*\d\*[0-9a-f]{32}\*[0-9a-f]{64}\*[0-9a-f]{32}\*[0-9a-f]{64}\*\d\*[^*]*(\*[0-9a-f]+)?$/i,
    modes: [
      { name: "KeePass 1 AES (without keyfile)", hashcat: 13400 },
    ],
  },
  {
    regex: /^\$keepass\$\*1\*\d+\*\d\*[0-9a-f]{32}\*[0-9a-f]{64}\*[0-9a-f]{32}\*[0-9a-f]{64}\*\d\*[^*]*(\*[0-9a-f]+)?\*\d+\*\d+\*[0-9a-f]{64}$/i,
    modes: [
      { name: "KeePass 1 TwoFish (with keyfile)", hashcat: 13400 },
    ],
  },
  {
    regex: /^\$keepass\$\*2\*\d+\*\d+\*[0-9a-f]+\*[0-9a-f]+\*[0-9a-f]+\*[0-9a-f]+\*[0-9a-f]+$/i,
    modes: [
      { name: "KeePass 2 AES (without keyfile)", hashcat: 13400 },
    ],
  },
  {
    regex: /^\$keepass\$\*2\*\d+\*\d+\*[0-9a-f]+\*[0-9a-f]+\*[0-9a-f]+\*[0-9a-f]+\*[0-9a-f]+\*\d+\*\d+\*[0-9a-f]+$/i,
    modes: [
      { name: "KeePass 2 AES (with keyfile)", hashcat: 13400 },
    ],
  },
  {
    regex: /^\$odf\$\*1\*1\*100000\*32\*[a-f0-9]{64}\*16\*[a-f0-9]{32}\*16\*[a-f0-9]{32}\*0\*[a-f0-9]{2048}$/i,
    modes: [
      { name: "Open Document Format (ODF) 1.2 (SHA-256, AES)", hashcat: 18400 },
    ],
  },
  {
    regex: /^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$/i,
    modes: [
      { name: "JWT (JSON Web Token)", hashcat: 16500 },
    ],
  },
  {
    regex: /^WPA\*0[12]\*([0-9a-fA-F]+)\*/i,
    modes: [
      { name: "WPA-PBKDF2-PMKID+EAPOL", hashcat: 22000 },
    ],
  },
];
