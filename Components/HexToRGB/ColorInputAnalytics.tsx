'use client'

import { TextAnalyticsType } from '@/types';
import React, { useState } from 'react'
import { IoQrCodeOutline, IoClipboardOutline, IoSaveOutline } from "react-icons/io5";
import { toast } from 'react-hot-toast'
import Modal from '@/Components/View/Modal';
import { QRCodeCanvas } from 'qrcode.react';

const ColorInputAnalytics = (props: TextAnalyticsType) => {

    const notifySuccess = ( message : string ) => toast.success(message)
    const [gotCode, setGotCode] = useState(false);

    const gotCodeClickedHandler = () => setGotCode(true);
    const gotCodeUnclickedHandler = () => setGotCode(false);

    const copyHandler = () => {
      navigator.clipboard.writeText(props.userInput);
      notifySuccess('Copied to clipboard');
    }

    const downloadHandler = () => {
      const element = document.createElement('a');
      const file = new Blob([props.userInput], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "output.txt";
      document.body.appendChild(element);
      element.click();
    }

  return (
    <div className='flex flex-row justify-between items-center mb-1.5'>
        <h2 className='font-bold text-xs text-gray-900 tracking-widest uppercase'>{props.title}</h2>
        <div className='flex flex-row items-center'>
            <div onClick={gotCodeClickedHandler} className="p-1.5 text-base hover:cursor-pointer text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 active:scale-95"><IoQrCodeOutline /></div>
            <div onClick={copyHandler} className="p-1.5 text-base hover:cursor-pointer text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 active:scale-95"><IoClipboardOutline /></div>
            <div onClick={downloadHandler} className="p-1.5 text-base hover:cursor-pointer text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 active:scale-95"><IoSaveOutline /></div>
        </div>
        {gotCode ? <Modal closeWindow={gotCodeUnclickedHandler}><div className='qrCodeOutput'>
          <QRCodeCanvas value={props.userInput} size={256} includeMargin={true} />
        </div></Modal> : ''}
    </div>
  )
}

export default ColorInputAnalytics
