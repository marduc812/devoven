'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { SAMPLES, dissectText, type Layer } from './logic';

const buttonClass = 'px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer';

type ParserProps = {
  layer: Layer;
  title: string;
  description: string;
  fromTitle: string;
};

/**
 * One parser per layer. They differ only in where the dissection starts, so
 * each page is this component with its layer.
 */
function PacketParser({ layer, title, description, fromTitle }: ParserProps) {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      return dissectText(input, layer);
    } catch (e: unknown) {
      return e instanceof Error ? `Error: ${e.message}` : 'Cannot read those bytes';
    }
  }, [input, layer]);

  return (
    <AdvancedConverter
      title={title}
      description={description}
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={fromTitle}
      toTitle="Dissection"
      backColor="sky"
      extraElements={
        <button className={buttonClass} onClick={() => setInput(SAMPLES[layer])}>Load Sample</button>
      }
    />
  );
}

export const EthernetFrameParser = () => (
  <PacketParser
    layer="ethernet"
    title="Ethernet Frame Parser"
    description="Decode an Ethernet II frame from hex: source and destination MAC, any stacked VLAN tags, and the EtherType. When the payload is IPv4 the dissection carries on down through the IP header and the transport header underneath it. Paste from [1 tcpdump -x 2] or Wireshark's copy-as-hex; offsets and the ASCII gutter are ignored."
    fromTitle="Frame Bytes"
  />
);

export const Ipv4HeaderParser = () => (
  <PacketParser
    layer="ipv4"
    title="IPv4 Header Parser"
    description="Decode an IPv4 header from hex. Every field is named, DSCP and ECN are resolved to their codepoint names, the header checksum is recomputed and checked, and the dissection follows the protocol field into the TCP or UDP header underneath. Fragments and truncated pastes are called out rather than silently misread."
    fromTitle="Packet Bytes"
  />
);

export const TcpHeaderParser = () => (
  <PacketParser
    layer="tcp"
    title="TCP Header Parser"
    description="Decode a TCP header from hex: ports, sequence and acknowledgement numbers, all nine flags, the window, and the options that actually matter for performance work: [1 MSS 2], [1 window scale 2], [1 SACK 2] and [1 timestamps 2]. When the payload looks like a TLS record, that gets dissected too."
    fromTitle="Segment Bytes"
  />
);

export const UdpHeaderParser = () => (
  <PacketParser
    layer="udp"
    title="UDP Header Parser"
    description="Decode a UDP header from hex. Eight bytes: source port, destination port, length and checksum. Well-known ports are named, the declared length is checked against what you pasted, and a zero checksum is reported as the deliberate opt-out IPv4 allows rather than as an error."
    fromTitle="Datagram Bytes"
  />
);

export const TlsRecordParser = () => (
  <PacketParser
    layer="tls"
    title="TLS Record Parser"
    description="Decode a TLS record layer from hex. Content type, version and length for each record in the stream, and for a handshake the message type as well: a ClientHello is read down to its cipher suites, [1 SNI 2], [1 ALPN 2] and supported versions, and an Alert is resolved to its level and description. Application data stays encrypted; there is nothing to read there without the session keys."
    fromTitle="Record Bytes"
  />
);
