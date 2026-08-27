'use client'

import { useSearchParams } from "next/navigation";
import { SetStateAction, useEffect, useState } from "react";
import Panel from "@/Components/MainView/MainPanel/Panel";
import { calculateRelLuminance, colorValidator, hexToRgb, resultContrastRatio } from "./Utils";
import ColorContrastCalculatorView from "../View/ColorContractCalculator";
import RelativeLuminanceView from "../View/RelativeLuminance";
import ScreenSizeView from "../View/ScreenSize";
import PasswordGeneratorView from "../View/PasswordGenerator";
import WiFiQRCodeView from "../View/WiFiQRCode";


export const ColorContractCalculator = () => {
    const [fromFg, setFromFg] = useState<string>('#FFFFFF');
    const [fromBg, setFromBg] = useState<string>('#000000');
    const [contrastRatio, setContrastRatio] = useState<number>(0);



    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );
        const from = searchParams.get('from') ?? '';

        if (from !== '') {
            const rgbValues = from.split(',').map(value => value.trim());
            if (rgbValues.length === 2) {
                if (colorValidator(rgbValues[0]) && colorValidator(rgbValues[1])) {
                    setFromFg(rgbValues[0])
                    setFromBg(rgbValues[1])
                }
            }
        }
    }, [])


    useEffect(() => {
        if (colorValidator(fromBg) && colorValidator(fromFg)) {
            setContrastRatio(resultContrastRatio(fromFg, fromBg))
        } else {
            setContrastRatio(0)
        }
    }, [fromFg, fromBg]);


    return (
        <Panel
            title="Color Contrast Ratio Calculator"
            description="Contrast ratio ranges from 1 to 21, usually presented as 1:1 or 21:1. WCAG has different ratio requirements for different input. Fill the foreground and background colors to calculate the ratio. For example, the value [1 Foreground: #FC0000 and background #000000 2] produces a contrast ratio of [1 5.25:1 2]."
            backColor='lime'
            extraElements={
                <ColorContrastCalculatorView
                    fromBg={fromBg}
                    fromFg={fromFg}
                    setFromBg={setFromBg}
                    setFromFg={setFromFg}
                    contrastRatio={contrastRatio}
                />
            }
        />
    )
}


export const RelativeLuminanceCalculator = () => {
    const [fromColor, setFromColor] = useState<string>('#FFFFFF');
    const [fromAccuracy, setFromAccuracy] = useState<number>(1);
    const [relLum, setRelLum] = useState<number>(1);

    
    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );
        const from = searchParams.get('from') ?? '';

        
        if (from !== '') {
            const relLumValues = from.split(',').map(value => value.trim());
            if (relLumValues.length === 2) {
                if (colorValidator(relLumValues[0]) && Number(relLumValues[1]) > 0 && Number(relLumValues[1]) < 11) {
                    setFromColor(relLumValues[0])
                    setFromAccuracy(Number(relLumValues[1]))
                }
            }
        }
    }, [])


    useEffect(() => {
        if (colorValidator(fromColor)) {
            setRelLum(calculateRelLuminance(fromColor))
        } else {
            setRelLum(0)
        }

    }, [fromColor, fromAccuracy]);

    const colorValidator = (userInput: string) => {
        if (/^#(?:[0-9a-fA-F]{6})$/.test(userInput)) {
            return true
        }
        return false
    }

    return (
        <Panel
            title="Relative Luminance Calculator"
            description="Relative luminance values span between 0 and 1, often denoted as 0:1 or 1:1. WCAG sets distinct luminance thresholds for varied elements. Input the primary and secondary colors to determine the luminance. For example, the value [1 Color: #AB3030 with 6 digits accuracy 2] produces a relative luminance of [1 0.10985232048663987 2]."
            backColor='lime'
            extraElements={
                <RelativeLuminanceView
                    fromAccuracy={fromAccuracy}
                    fromColor={fromColor}
                    setFromAccuracy={setFromAccuracy}
                    setFromColor={setFromColor}
                    toValue={relLum}
                />
            }
        />
    )
}


export const ScreenSizeCalculator = () => {

    return (
        <Panel
            title="Screen Size Calculator"
            description="The size of the screen resolution is measured in pixels. Below you can see how many pixels is the size of your browser. For example, the resolution of an [1 iPad Air 2] is [1 820x1180 2]."
            backColor='lime'
            extraElements={
                <ScreenSizeView />
            }
        />
    )
}

export const PasswordGenerator = () => {
    const [password, setPassword] = useState('')
    const [allowedSpecialChars, setAllowedSpecialChars] = useState('`~!@#$%^&*()\'";:/?.,[]\\}{-_=+')
    const [passwordLength, setPasswordLength] = useState(15);
    const [upperCase, setUpperCase] = useState(true);
    const [numbers, setNumbers] = useState(true);
    const [specialChars, setSpecialChars] = useState(true)

    useEffect(() => {
        makePass()
    }, [allowedSpecialChars, passwordLength, upperCase, numbers, specialChars]);

    const makePass = () => {
        let result = ''
        let characters = 'abcdefghijklmnopqrstuvwxyz';
        if (upperCase)
            characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        if (numbers)
            characters += '1234567890'
        if (specialChars)
            characters += allowedSpecialChars

        var charactersLength = characters.length;
        for (var i = 0; i < passwordLength; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        setPassword(result);
    }

    return (
        <Panel
            title="Online Password Generator"
            description="A random string will be generated, following the user supplied requirements. The passwords are generated on your browser and no passwords are ever stored or shared."
            backColor='lime'
            extraElements={
                <PasswordGeneratorView
                    password={password}
                    allowedSpecialChars={allowedSpecialChars}
                    passwordLength={passwordLength}
                    upperCase={upperCase}
                    numbers={numbers}
                    specialChars={specialChars}
                    setAllowedSpecialChars={setAllowedSpecialChars}
                    setPasswordLength={setPasswordLength}
                    setUpperCase={setUpperCase}
                    setNumbers={setNumbers}
                    setSpecialChars={setSpecialChars}
                    makePass={makePass}
                />

            }
        />
    )
}


export const WiFiQRCodeGenerator = () => {
    const [ssid, setSSID] = useState('')
    const [wifiKey, setWifiKey] = useState('')
    const [qrString, setQrString] = useState('')
    const [encryption, setEncryption] = useState('WPA')
    const [hidden, setHidden] = useState(false)
    const [foreground, setForeground] = useState('#000000')
    const [background, setBackground] = useState('#FFFFFF')
    const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H')
    const [margin, setMargin] = useState(false)

    useEffect(() => {
        setQrString('WIFI:S:' + ssid + ';T:' + encryption + ';P:' + wifiKey + ';H:' + (hidden ? 'true' : 'false') + ';');
    }, [ssid, wifiKey, encryption, hidden, foreground, background, level, margin]);

    return (
        <Panel
            title="Online WiFi QR Code Generator"
            description="Generate a QR code for your WiFi. This application runs on your browser and no information is transfered or stored anywhere. The QR code generated follows the WiFi QR code standard and when scanned by a QR code reader or the camera application, it will prompt the user to join the network. For example, the following configuration [1 SSID: Test, Password:12341234, EncryptionType: WEP and Visibility: Hidden 2] produces a string of [1 WIFI:S:Test;T:WEP;P:12341234;H:true; 2]."
            backColor='lime'
            extraElements={
                <WiFiQRCodeView
                    wifiKey={wifiKey} setWifiKey={setWifiKey}
                    ssid={ssid} setSSID={setSSID}
                    qrString={qrString}
                    encryption={encryption} setEncryption={setEncryption}
                    hidden={hidden} setHidden={setHidden}
                    foreground={foreground} setForeground={setForeground}
                    background={background} setBackground={setBackground}
                    level={level} setLevel={setLevel}
                    margin={margin} setMargin={setMargin} />
            }
        />
    )
}

