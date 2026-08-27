import React from 'react'
import { createPortal } from 'react-dom'
import { ModalPropsType, ModalOverlayProps } from '@/types'

const Modal: React.FC<ModalPropsType> = (props) => {

    const Backdrop = () => {
        return (
            <div className="backdrop" onClick={props.closeWindow}></div>)
    }

    const ModalOverlay: React.FC<ModalOverlayProps> = ({ children }) => {
        return (
            <div className="modal">
                <div className='flex flex-row justify-between items-center'>
                    <h3 className='font-bold text-2xl px-2'>QR Code</h3>
                    <span onClick={props.closeWindow} className="close">&times;</span>
                </div>
                <p>Scan the picture below with your camera</p>
                <div className='flex flex-row w-full justify-center'>
                    {children}
                </div>
                
            </div>
        );
    }

    const portalElement = document.getElementById("overlays")

    if (!portalElement) return null;

    return (
        <>
            {createPortal(<Backdrop />, portalElement)}
            {createPortal(<ModalOverlay>{props.children}</ModalOverlay>, portalElement)}
        </>
    )
}

export default Modal