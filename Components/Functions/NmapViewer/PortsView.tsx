import React, { useState } from 'react';
import { PortType } from './types';
import { getCPE, getScripts } from './utils';
import { VscLock } from 'react-icons/vsc';
import ScriptsView from './ScriptsView';
import CPEView from './CPEView';
import { BadgeTone, StatusBadge } from '@/Components/MainView/MainPanel/ResultUI';

const PortsView = (props: { scanPorts: PortType[], host: string }) => {

    const portsArray = Array.isArray(props.scanPorts) ? props.scanPorts : [props.scanPorts];

    const ports = portsArray.map((port, index) =>
        <PortView scanPort={port} key={`${props.host}-${index}`} />
    );

    return (
        <div className='overflow-x-auto'>
            <table className='w-full border-collapse text-xs'>
                <thead>
                    <tr className='bg-gray-50'>
                        <Th>Port</Th>
                        <Th>State</Th>
                        <Th>Info</Th>
                        <Th>Service</Th>
                        <Th>Version</Th>
                        <Th>Product</Th>
                    </tr>
                </thead>
                <tbody>
                    {ports}
                </tbody>
            </table>
        </div>
    );
};

export default PortsView;


const Th = (props: { children: React.ReactNode }) => (
    <th className='px-3 py-2 text-left font-bold uppercase tracking-widest text-[10px] text-gray-500 whitespace-nowrap'>
        {props.children}
    </th>
);

/** open / closed / filtered map onto the shared badge tones. */
const stateTone = (state: string): BadgeTone =>
    state === 'open' ? 'pass' : state === 'closed' ? 'fail' : 'warn';


const PortView = (props: { scanPort: PortType }) => {

    const [expandedScript, setExpandedScript] = useState(false);
    const [expandedCPE, setExpandedCPE] = useState(false);

    const toggleExpandedScript = () => { setExpandedScript(!expandedScript); setExpandedCPE(false); };
    const toggleExpandedCPE = () => { setExpandedCPE(!expandedCPE); setExpandedScript(false); };

    if (props.scanPort === undefined) return <></>;

    const state = props.scanPort?.state?.["@_state"] ?? '';
    const serviceName = props.scanPort?.service?.['@_name'] ?? '';
    const serviceProduct = props.scanPort?.service?.['@_product'] ?? '';
    const serviceVersion = props.scanPort?.service?.['@_version'] ?? '';
    const serviceCPE = props.scanPort?.service?.cpe ? getCPE(props.scanPort.service.cpe) : '';
    const portId = props.scanPort?.["@_portid"] ?? '';
    const protocol = props.scanPort?.["@_protocol"] ?? '';
    const script = props.scanPort?.script ? getScripts(props.scanPort.script) : '';

    // nmap reports TLS either as a tunnel attribute, through the service name,
    // or only through the ssl-* NSE scripts having run against the port.
    const tunnel = props.scanPort?.service?.['@_tunnel'] ?? '';
    const rawScripts = props.scanPort?.script ?? [];
    const scriptIds = (Array.isArray(rawScripts) ? rawScripts : [rawScripts]).map(s => s?.['@_id'] ?? '');
    const isTLS = tunnel === 'ssl'
        || serviceName.includes('ssl')
        || serviceName === 'https'
        || scriptIds.some(id => id.startsWith('ssl-'));

    const hasScript = script !== '';
    const hasCPE = serviceCPE !== '';
    const expandedRow = (expandedScript && hasScript) || (expandedCPE && hasCPE);

    return (
        <>
            <tr className={`border-t border-gray-200 ${expandedRow ? 'bg-gray-50' : ''}`}>
                <td className='px-3 py-2 whitespace-nowrap'>
                    <span className='font-mono font-bold text-gray-900'>{portId}</span>
                    {protocol && <span className='font-mono text-gray-400 ml-1'>/{protocol}</span>}
                </td>
                <td className='px-3 py-2'>
                    <StatusBadge tone={stateTone(state)}>{state || 'unknown'}</StatusBadge>
                </td>
                <td className='px-3 py-2'>
                    <div className='flex items-center gap-1'>
                        <InfoPill letter='S' title='Scripts' active={hasScript} expanded={expandedScript} onClick={toggleExpandedScript} />
                        <InfoPill letter='C' title='CPE' active={hasCPE} expanded={expandedCPE} onClick={toggleExpandedCPE} />
                        <span className='w-6 h-6 inline-flex items-center justify-center' title={isTLS ? 'TLS / SSL' : undefined}>
                            {isTLS && <VscLock className='text-amber-700' aria-label='TLS' />}
                        </span>
                    </div>
                </td>
                <td className='px-3 py-2 font-mono text-gray-900'>{serviceName || '—'}</td>
                <td className='px-3 py-2 font-mono text-gray-600'>{serviceVersion || '—'}</td>
                <td className='px-3 py-2 font-mono text-gray-600'>{serviceProduct || '—'}</td>
            </tr>
            {expandedScript && hasScript && (
                <tr className='border-t border-gray-200'>
                    <td colSpan={6} className='p-0'>
                        <ScriptsView scripts={script} port={portId} />
                    </td>
                </tr>
            )}
            {expandedCPE && hasCPE && (
                <tr className='border-t border-gray-200'>
                    <td colSpan={6} className='p-0'>
                        <CPEView cpe={serviceCPE} />
                    </td>
                </tr>
            )}
        </>
    );
};


/** The S / C toggles. Greyed out — not hidden — when the port has no such data. */
const InfoPill = (props: { letter: string, title: string, active: boolean, expanded: boolean, onClick: () => void }) => {
    if (!props.active) {
        return (
            <span
                className='w-6 h-6 inline-flex items-center justify-center border border-transparent font-bold text-gray-400 cursor-default'
                title={`No ${props.title.toLowerCase()}`}
            >
                {props.letter}
            </span>
        );
    }

    return (
        <button
            type='button'
            onClick={props.onClick}
            aria-expanded={props.expanded}
            title={props.title}
            className={`w-6 h-6 inline-flex items-center justify-center border font-bold cursor-pointer transition-colors duration-150 ${
                props.expanded
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'
            }`}
        >
            {props.letter}
        </button>
    );
};
