import React from 'react';
import { ScanInfoType } from './types';
import { SectionTitle, StatTile } from '@/Components/MainView/MainPanel/ResultUI';

const ScanInfo = (props: { scanInfo: ScanInfoType }) => {

  const type = props.scanInfo['@_type'] ? props.scanInfo['@_type'] : '-';
  const protocol = props.scanInfo['@_protocol'] ? props.scanInfo['@_protocol'] : '-';
  const ports = props.scanInfo['@_numservices'] ? props.scanInfo['@_numservices'] : '-';

  return (
    <div className='flex flex-col gap-2'>
      <SectionTitle>Scan Info</SectionTitle>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
        <StatTile label='Type' value={type.toUpperCase()} />
        <StatTile label='Protocol' value={protocol.toUpperCase()} />
        <StatTile label='Scanned Ports' value={ports} />
      </div>
    </div>
  );
};

export default ScanInfo;
