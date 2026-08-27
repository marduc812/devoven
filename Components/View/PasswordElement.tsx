import { SelectElementsPasswordPropsType } from '@/types'
import React from 'react'

export const PasswordElement: React.FC<SelectElementsPasswordPropsType> = ({ passwd, setPasswd }) => {
    return (
        <div className='flex flex-row items-center gap-2'>
            <label htmlFor="password-input" className='text-gray-600 text-sm font-medium flex-shrink-0'>Key:</label>
            <input
                placeholder='Secret key'
                className='border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition-colors'
                type="text"
                id="password-input"
                name="password-input"
                onChange={(e) => setPasswd(e.target.value)}
                value={passwd}
            />
        </div>
    )
}