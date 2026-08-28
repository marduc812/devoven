import React, { useEffect, useState } from 'react';
import { HostType } from './types';
import { filterPort, findOS, generatePortScanInfo, getAddresses, getHostnames } from './utils';
import { VscChevronDown } from 'react-icons/vsc';
import PortsView from './PortsView';
import Search from './Search';
import ExportView from './ExportView';
import { SectionTitle, StatusBadge } from '@/Components/MainView/MainPanel/ResultUI';

const HostsView = (props: { hosts: HostType | HostType[], title: string }) => {

  const [allHosts, setAllHosts] = useState<HostType[]>([]);
  const [filteredHosts, setFilteredHosts] = useState<HostType[]>([]);

  useEffect(() => {
    const hostsArray = Array.isArray(props.hosts) ? props.hosts : [props.hosts];
    setAllHosts(hostsArray);
    setFilteredHosts(hostsArray);
  }, [props.hosts]);

  const handleSearch = (searchQuery: string) => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    let filter = "";
    let searchvalue = "";

    if (lowerCaseQuery.includes(":")) {
      filter = lowerCaseQuery.split(':')[0].trim();
      searchvalue = lowerCaseQuery.split(':')[1].trim();
    } else {
      searchvalue = lowerCaseQuery;
    }

    const filtered = allHosts.filter(host => {
      let addresses = Array.isArray(host.address) ? host.address : [host.address];
      const ipMatch = addresses.some(address => address['@_addr'].toLowerCase().includes(searchvalue));
      const hostnameMatch = getHostnames(host.hostnames).toLowerCase().includes(searchvalue);

      if (filter === 'host') return ipMatch || hostnameMatch;

      const status = host.status['@_state'] === searchvalue;
      if (filter === 'status') return status;

      const port = filterPort(host.ports, searchvalue, filter);
      return ipMatch || hostnameMatch || port || status;
    });
    setFilteredHosts(filtered);
  };

  return (
    <div className='w-full flex flex-col gap-3'>
      <Search onSearch={handleSearch} />

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SectionTitle note={`${filteredHosts.length} of ${allHosts.length}`}>Hosts</SectionTitle>
        <ExportView title={props.title} hosts={filteredHosts} />
      </div>

      {filteredHosts.length === 0 ? (
        <p className='border border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500'>
          No host matches this search.
        </p>
      ) : (
        <div className='flex flex-col gap-2'>
          {filteredHosts.map((hostItem, index) => (
            <HostView key={index} host={hostItem} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HostsView;


const HostView = (props: { host: HostType }) => {

  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(!expanded);

  const addresses = Array.isArray(props.host.address) ? props.host.address : [props.host.address];
  const portsData = props.host.ports ? props.host.ports.port : [];

  const parsedAddress = getAddresses(addresses);
  const ip = parsedAddress.ipv4;
  const ipv6 = parsedAddress.ipv6;
  const mac = parsedAddress.mac;

  const isUp = props.host.status['@_state'] === 'up';
  const hostnames = getHostnames(props.host.hostnames);

  const ports = generatePortScanInfo(props.host.ports);
  const openCount = ports.filter(item => item.state === "open").length;
  // findOS() reports '?' for whatever it could not determine; drop those, and
  // collapse the common "Linux Linux" case where vendor and family agree.
  const os: { vendor: string, family: string } = findOS(props.host);
  const osLabel = [...new Set([os.vendor, os.family].filter(part => part && part !== '?'))].join(' ');

  const hasPorts = ports.length !== 0;
  const hasExtraAddresses = ipv6 !== "" || mac !== "";

  return (
    <div className='border border-gray-200 bg-white'>
      {/* The row toggles the ports, but the address and hostname inside it are
          their own copy buttons - so the row is a div, not a button, and the
          chevron carries the keyboard-accessible toggle. */}
      <div
        onClick={hasPorts ? toggleExpanded : undefined}
        className={`w-full text-left px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between transition-colors duration-150 ${
          hasPorts ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
        }`}
      >
        <span className='flex items-center gap-2.5 min-w-0'>
          <span
            className={`w-2 h-2 flex-shrink-0 ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}
            aria-hidden='true'
          />
          {ip ? (
            <CopyValue
              value={ip}
              label='IP'
              className={`font-mono text-sm font-bold ${isUp ? 'text-gray-900' : 'text-gray-500'}`}
            />
          ) : (
            <span className='font-mono text-sm font-bold text-gray-500'>—</span>
          )}
          {hostnames !== "" && (
            <CopyValue
              value={hostnames}
              label='hostname'
              className='font-mono text-xs text-gray-500 truncate'
            />
          )}
        </span>

        <span className='flex items-center gap-3 flex-shrink-0'>
          {osLabel && <Meta label='OS' value={osLabel} />}
          <StatusBadge tone={isUp ? 'pass' : 'fail'}>{isUp ? 'up' : 'down'}</StatusBadge>
          <StatusBadge tone={openCount > 0 ? 'info' : 'neutral'}>{openCount} open</StatusBadge>
          <button
            type='button'
            onClick={hasPorts ? toggleExpanded : undefined}
            aria-expanded={hasPorts ? expanded : undefined}
            aria-label={expanded ? 'Hide ports' : 'Show ports'}
            disabled={!hasPorts}
            className={hasPorts ? 'cursor-pointer' : 'cursor-default'}
          >
            <VscChevronDown
              aria-hidden='true'
              className={`text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''} ${hasPorts ? '' : 'opacity-0'}`}
            />
          </button>
        </span>
      </div>

      {hasExtraAddresses && (
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 px-3 py-1.5'>
          {ipv6 !== "" && <Meta label='IPv6' value={ipv6} mono copyable />}
          {mac !== "" && <Meta label='MAC' value={mac} mono copyable />}
        </div>
      )}

      {expanded && hasPorts && (
        <div className='border-t border-gray-200'>
          <PortsView scanPorts={portsData} host={ip} />
        </div>
      )}
    </div>
  );
};


const Meta = (props: { label: string, value: string, mono?: boolean, copyable?: boolean }) => (
  <span className='flex items-center gap-1.5 min-w-0'>
    <span className='text-[10px] font-bold uppercase tracking-widest text-gray-500'>{props.label}</span>
    {props.copyable ? (
      <CopyValue
        value={props.value}
        label={props.label}
        className={`text-xs text-gray-900 truncate ${props.mono ? 'font-mono' : ''}`}
      />
    ) : (
      <span className={`text-xs text-gray-900 truncate ${props.mono ? 'font-mono' : ''}`}>{props.value}</span>
    )}
  </span>
);


/**
 * A value that copies itself when clicked. Sits inside the host row, so it has
 * to stop the click from reaching the row's expand/collapse handler.
 */
const CopyValue = (props: { value: string, label: string, className?: string }) => {

  const [copied, setCopied] = useState(false);

  const copy = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(props.value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {}
    );
  };

  return (
    <span className='inline-flex items-center gap-1.5 min-w-0'>
      <button
        type='button'
        onClick={copy}
        title={`Copy ${props.label}`}
        aria-label={`Copy ${props.label} ${props.value}`}
        className={`cursor-pointer text-left truncate hover:underline decoration-dotted underline-offset-4 ${props.className ?? ''}`}
      >
        {props.value}
      </button>
      {copied && (
        <span className='text-[10px] uppercase tracking-widest text-emerald-600 flex-shrink-0'>copied</span>
      )}
    </span>
  );
};
