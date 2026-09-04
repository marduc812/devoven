import React, { useEffect, useState } from 'react'

const ScreenSizeView = () => {

    const useWindowDimensions = () => {
        const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

        useEffect(() => {
            setWindowDimensions(getWindowDimensions());
            function handleResize() {
                setWindowDimensions(getWindowDimensions());
            }

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        return windowDimensions;
    }

    const getWindowDimensions = () => {
        const { innerWidth: width, innerHeight: height } = window;
        return { width, height };
    }

    const { height, width } = useWindowDimensions();

    useEffect(() => {
        const can = document.getElementById('canvas') as HTMLCanvasElement;
        if (!can) return;
        var ctx = can.getContext("2d");
        if (!ctx) return;

        const xSize = width / 2;
        const ySize = height / 2;

        ctx.clearRect(0, 0, xSize, ySize);
        ctx.beginPath();
        ctx.moveTo(10, 20);
        ctx.lineTo(10, (height / 2) - 20);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.stroke();
        ctx.moveTo(20, 10);
        ctx.lineTo((width / 2) - 20, 10);
        ctx.stroke();
        ctx.font = "30px Arial";
        ctx.fillStyle = "#4ade80";
        ctx.fillText(width + 'px', xSize / 2 - 30, 50);
        ctx.fillText(height + 'px', 30, ySize / 2);
    }, [height, width]);

    return (
        <div className='centered-content'>
            <div className='flex flex-col gap-4'>
                <div className='flex flex-col p-1'>
                    <h2 className='font-semibold text-lg text-gray-900 mb-3'>Screen Resolution</h2>
                    <div className='flex flex-col items-center gap-1 mb-4'>
                        <p className='text-2xl text-gray-700'>Width: <span className='text-3xl font-bold text-gray-900'>{width}</span>px</p>
                        <p className='text-2xl text-gray-700'>Height: <span className='text-3xl font-bold text-gray-900'>{height}</span>px</p>
                    </div>
                    <div className='flex flex-row items-center justify-center'>
                        <canvas
                            width={width / 2}
                            height={height / 2}
                            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            id='canvas'
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ScreenSizeView
