import React, { Dispatch, SetStateAction } from 'react'
import { QRCodeCanvas } from 'qrcode.react';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

type WiFiQRCodeTypes = {
    ssid: string;
    setSSID: Dispatch<SetStateAction<string>>;
    wifiKey: string;
    setWifiKey: Dispatch<SetStateAction<string>>;
    qrString: string;
    encryption: string;
    setEncryption: Dispatch<SetStateAction<string>>;
    hidden: boolean;
    setHidden: Dispatch<SetStateAction<boolean>>;
    foreground: string;
    setForeground: Dispatch<SetStateAction<string>>;
    background: string;
    setBackground: Dispatch<SetStateAction<string>>;
    level: ErrorCorrectionLevel;
    setLevel: Dispatch<SetStateAction<ErrorCorrectionLevel>>;
    margin: boolean;
    setMargin: Dispatch<SetStateAction<boolean>>;
}

const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none text-sm';
const selectClass = 'bg-white text-gray-900 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900 w-full';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1';

const WiFiQRCodeView = (props: WiFiQRCodeTypes) => {

    const downloadQr = () => {
        const canvas = document.querySelector('.qrCodeOutput canvas') as HTMLCanvasElement;
        if (canvas) {
            const link = document.createElement('a');
            link.download = (props.ssid || 'wifi') + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Network fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>SSID (WiFi Name)</label>
                    <input className={inputClass} value={props.ssid} onChange={e => props.setSSID(e.target.value)} placeholder="My WiFi Network" />
                </div>
                <div>
                    <label className={labelClass}>Password</label>
                    <input className={inputClass} type="text" value={props.wifiKey} onChange={e => props.setWifiKey(e.target.value)} placeholder="Network password" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                <div>
                    <label className={labelClass}>Encryption</label>
                    <select className={selectClass} value={props.encryption} onChange={e => props.setEncryption(e.target.value)}>
                        <option value="WPA">WPA/WPA2/WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None</option>
                    </select>
                </div>
                <div className="flex items-center gap-3 pb-2">
                    <div
                        onClick={() => props.setHidden(!props.hidden)}
                        className={`w-4 h-4 border flex items-center justify-center cursor-pointer flex-shrink-0 ${props.hidden ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-400'}`}
                    >
                        {props.hidden && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                    <label className={labelClass + ' mb-0 cursor-pointer'} onClick={() => props.setHidden(!props.hidden)}>Hidden Network</label>
                </div>
            </div>

            {/* QR Settings */}
            <div className="border-t border-gray-200 pt-5 flex flex-col gap-4">
                <p className={labelClass}>QR Settings</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className={labelClass}>Foreground</label>
                        <input type="color" className="h-9 w-full border border-gray-300 cursor-pointer p-0.5" defaultValue={props.foreground} onChange={e => props.setForeground(e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Background</label>
                        <input type="color" className="h-9 w-full border border-gray-300 cursor-pointer p-0.5" defaultValue={props.background} onChange={e => props.setBackground(e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Error Correction</label>
                        <select className={selectClass} value={props.level} onChange={e => props.setLevel(e.target.value as ErrorCorrectionLevel)}>
                            <option value="L">Low</option>
                            <option value="M">Medium</option>
                            <option value="Q">Quartile</option>
                            <option value="H">High</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3 pb-2">
                        <div
                            onClick={() => props.setMargin(!props.margin)}
                            className={`w-4 h-4 border flex items-center justify-center cursor-pointer flex-shrink-0 ${props.margin ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-400'}`}
                        >
                            {props.margin && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                        <label className={labelClass + ' mb-0 cursor-pointer'} onClick={() => props.setMargin(!props.margin)}>Margin</label>
                    </div>
                </div>
            </div>

            {/* QR Output */}
            {props.ssid && props.ssid.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="border border-gray-200 p-6 flex justify-center bg-white qrCodeOutput">
                        <QRCodeCanvas
                            value={props.qrString}
                            size={256}
                            bgColor={props.background}
                            fgColor={props.foreground}
                            level={props.level}
                            includeMargin={props.margin}
                        />
                    </div>
                    <button
                        onClick={downloadQr}
                        className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Download PNG
                    </button>
                </div>
            )}
        </div>
    );
}

export default WiFiQRCodeView
