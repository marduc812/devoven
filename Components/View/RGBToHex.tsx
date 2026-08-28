import React, { Dispatch, SetStateAction } from 'react'
import { IoClipboardOutline } from 'react-icons/io5';
import toast from 'react-hot-toast'

type RGBToHexTypes = {
    fromRed: string;
    fromGreen: string;
    fromBlue: string;
    toValue: string;
    setFromRed: Dispatch<SetStateAction<string>>;
    setFromGreen: Dispatch<SetStateAction<string>>;
    setFromBlue: Dispatch<SetStateAction<string>>;
}

const RGBToHexView = (props: RGBToHexTypes) => {

    const copyHandler = () => {
        navigator.clipboard.writeText(props.toValue);
        toast.success('Copied to clipboard');
    }

    const channels = [
        { label: 'R', name: 'Red',   value: props.fromRed,   set: props.setFromRed,   accent: 'text-red-400' },
        { label: 'G', name: 'Green', value: props.fromGreen, set: props.setFromGreen, accent: 'text-green-400' },
        { label: 'B', name: 'Blue',  value: props.fromBlue,  set: props.setFromBlue,  accent: 'text-blue-400' },
    ];

    return (
        <div className="flex flex-col gap-5 w-full">

            {/* Color swatch */}
            <div
                style={{ backgroundColor: props.toValue || '#000000' }}
                className="h-14 w-full rounded-xl border border-white/10 transition-colors duration-300"
            />

            {/* RGB sliders */}
            <div className="flex flex-col gap-3">
                {channels.map(({ label, name, value, set, accent }) => (
                    <div key={label} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-4 shrink-0 ${accent}`}>{label}</span>
                        <input
                            type="number"
                            min="0"
                            max="255"
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            aria-label={name}
                            className="w-14 shrink-0 bg-gray-950/80 border border-white/10 rounded-lg text-gray-100 text-sm text-center px-2 py-1.5 focus:border-white/20 focus:outline-none"
                        />
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            aria-label={`${name} slider`}
                            className="flex-1 accent-cyan-500"
                        />
                    </div>
                ))}
            </div>

            {/* Hex output */}
            <button
                onClick={copyHandler}
                className="flex items-center justify-between bg-gray-950/80 border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-all duration-200 group"
            >
                <span className="text-lg font-mono text-white">{props.toValue}</span>
                <IoClipboardOutline className="text-gray-600 group-hover:text-gray-300 transition-colors shrink-0 ml-2" />
            </button>

        </div>
    )
}

export default RGBToHexView
