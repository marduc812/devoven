import React, { Dispatch, SetStateAction } from 'react'
import { IoClipboardOutline, IoRefreshSharp } from 'react-icons/io5';
import toast from 'react-hot-toast'
import { Switch } from '@/Components/UI/Switch'

type PasswordGeneratorTypes = {
    password: string;
    allowedSpecialChars: string;
    passwordLength: number;
    upperCase: boolean;
    numbers: boolean;
    specialChars: boolean;
    setPasswordLength: Dispatch<SetStateAction<number>>;
    setAllowedSpecialChars: Dispatch<SetStateAction<string>>;
    setUpperCase: Dispatch<SetStateAction<boolean>>;
    setNumbers: Dispatch<SetStateAction<boolean>>;
    setSpecialChars: Dispatch<SetStateAction<boolean>>;
    makePass: () => void;
}

type CharType = 'number' | 'lowercase' | 'uppercase' | 'symbol';

function determineCharType(char: string): CharType {
    if (/^\d$/.test(char)) return 'number';
    if (/^[a-z]$/.test(char)) return 'lowercase';
    if (/^[A-Z]$/.test(char)) return 'uppercase';
    return 'symbol';
}

const PasswordGeneratorView = (props: PasswordGeneratorTypes) => {

    const copyHandler = () => {
        navigator.clipboard.writeText(props.password);
        toast.success('Copied to clipboard');
    }

    const styledContent = Array.from(props.password).map((char, index) => {
        let classes = ''
        switch (determineCharType(char)) {
            case 'number':    classes = 'text-emerald-700'; break;
            case 'lowercase': classes = 'text-gray-700';                          break;
            case 'uppercase': classes = 'text-gray-900 font-bold';                break;
            case 'symbol':    classes = 'text-red-700';         break;
        }
        return <span key={index} className={classes}>{char}</span>;
    });

    const toggles = [
        { label: 'Uppercase',          value: props.upperCase,    set: props.setUpperCase },
        { label: 'Numbers',            value: props.numbers,      set: props.setNumbers },
        { label: 'Special Characters', value: props.specialChars, set: props.setSpecialChars },
    ];

    return (
        <div className="flex flex-col gap-5 w-full">

            {/* Password display */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</span>
                <div className="flex flex-wrap items-stretch gap-2">
                    <div className="flex-1 min-w-0 bg-white border border-gray-300 px-3 py-2 font-mono text-base overflow-x-auto whitespace-nowrap hide-scrollbar">
                        {styledContent}
                    </div>
                    <button onClick={props.makePass} className="flex-shrink-0 border border-gray-300 flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150" aria-label="Regenerate">
                        <IoRefreshSharp className="text-base" />
                        <span className="uppercase tracking-wide text-xs font-semibold">New</span>
                    </button>
                    <button onClick={copyHandler} className="flex-shrink-0 border border-gray-300 flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150" aria-label="Copy">
                        <IoClipboardOutline className="text-base" />
                        <span className="uppercase tracking-wide text-xs font-semibold">Copy</span>
                    </button>
                </div>
            </div>

            {/* Length slider */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Length</span>
                    <span className="text-xs text-gray-600 font-mono">{props.passwordLength}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="80"
                    value={props.passwordLength}
                    onChange={(e) => props.setPasswordLength(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                />
            </div>

            {/* Toggle options */}
            <div className="flex flex-col gap-3">
                {toggles.map(({ label, value, set }) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <Switch checked={value} onChange={set} />
                    </div>
                ))}
            </div>

            {/* Allowed special chars */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allowed Special Characters</span>
                <input
                    defaultValue={props.allowedSpecialChars}
                    onChange={(e) => props.setAllowedSpecialChars(e.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 font-mono text-sm focus:border-gray-900 focus:outline-none transition-colors"
                />
            </div>

        </div>
    )
}

export default PasswordGeneratorView
