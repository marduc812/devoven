import React from 'react'
import { parseNmapScan } from './utils';
import ScanInfo from './ScanInfo';
import HostsView from './HostView';
import { ErrorNote } from '@/Components/MainView/MainPanel/ResultUI';

const NmapViewer = (props: { nmapScan: string, title: string }) => {

    const parsedNmap = parseNmapScan(props.nmapScan);

    // fast-xml-parser is lenient, so a non-nmap document parses fine but has no
    // <nmaprun> root — say so instead of rendering an empty page.
    if (!parsedNmap?.nmaprun) {
        return <ErrorNote>That file does not look like an Nmap XML scan (no &lt;nmaprun&gt; element found).</ErrorNote>;
    }

    return (
        <div className='flex flex-col gap-6'>
            {parsedNmap.nmaprun.scaninfo && <ScanInfo scanInfo={parsedNmap.nmaprun.scaninfo} />}
            {parsedNmap.nmaprun.host && <HostsView hosts={parsedNmap.nmaprun.host} title={props.title} />}
        </div>
    )
}

export default NmapViewer
