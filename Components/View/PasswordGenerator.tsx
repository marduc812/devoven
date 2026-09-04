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
            case 'number':    classes = 'text-lime-400';  break;
            case 'lowercase': classes = 'text-gray-400';  break;
            case 'uppercase': classes = 'text-gray-900';  break;
            case 'symbol':    classes = 'text-red-400';   break;
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
            <div className="flex items-center gap-2 bg-gray-950/80 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex-1 font-mono text-base overflow-x-auto whitespace-nowrap hide-scrollbar">
                    {styledContent}
                </div>
                <button
                    onClick={props.makePass}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-50 transition-all duration-200 shrink-0"
                    aria-label="Regenerate"
                >
                    <IoRefreshSharp />
                </button>
                <button
                    onClick={copyHandler}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-50 transition-all duration-200 shrink-0"
                    aria-label="Copy"
                >
                    <IoClipboardOutline />
                </button>
            </div>

            {/* Length slider */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Length</span>
                    <span className="text-xs text-gray-400 font-mono">{props.passwordLength}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="80"
                    value={props.passwordLength}
                    onChange={(e) => props.setPasswordLength(Number(e.target.value))}
                    className="w-full accent-lime-500"
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
                <span className="text-xs text-gray-500 uppercase tracking-wider">Allowed Special Characters</span>
                <input
                    defaultValue={props.allowedSpecialChars}
                    onChange={(e) => props.setAllowedSpecialChars(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-2.5 text-gray-300 font-mono text-sm focus:border-white/20 focus:outline-none transition-colors"
                />
            </div>

        </div>
    )
}

export default PasswordGeneratorView
