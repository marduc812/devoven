// ─── A1. Port Reference ───────────────────────────────────────────────────────

export type PortEntry = { port: number; protocol: 'TCP' | 'UDP' | 'TCP/UDP'; service: string; description: string };

export const PORT_TABLE: PortEntry[] = [
  {port:20, protocol:'TCP', service:'FTP-DATA', description:'FTP data transfer'},
  {port:21, protocol:'TCP', service:'FTP', description:'FTP control'},
  {port:22, protocol:'TCP', service:'SSH', description:'Secure Shell'},
  {port:23, protocol:'TCP', service:'TELNET', description:'Telnet'},
  {port:25, protocol:'TCP', service:'SMTP', description:'Simple Mail Transfer Protocol'},
  {port:53, protocol:'TCP/UDP', service:'DNS', description:'Domain Name System'},
  {port:67, protocol:'UDP', service:'DHCP', description:'DHCP server'},
  {port:68, protocol:'UDP', service:'DHCP', description:'DHCP client'},
  {port:80, protocol:'TCP', service:'HTTP', description:'Hypertext Transfer Protocol'},
  {port:110, protocol:'TCP', service:'POP3', description:'Post Office Protocol v3'},
  {port:123, protocol:'UDP', service:'NTP', description:'Network Time Protocol'},
  {port:143, protocol:'TCP', service:'IMAP', description:'Internet Message Access Protocol'},
  {port:161, protocol:'UDP', service:'SNMP', description:'Simple Network Management Protocol'},
  {port:194, protocol:'TCP', service:'IRC', description:'Internet Relay Chat'},
  {port:443, protocol:'TCP', service:'HTTPS', description:'HTTP over TLS/SSL'},
  {port:465, protocol:'TCP', service:'SMTPS', description:'SMTP over TLS'},
  {port:587, protocol:'TCP', service:'SMTP', description:'SMTP submission'},
  {port:993, protocol:'TCP', service:'IMAPS', description:'IMAP over TLS'},
  {port:995, protocol:'TCP', service:'POP3S', description:'POP3 over TLS'},
  {port:1194, protocol:'UDP', service:'OpenVPN', description:'OpenVPN'},
  {port:1433, protocol:'TCP', service:'MSSQL', description:'Microsoft SQL Server'},
  {port:1521, protocol:'TCP', service:'Oracle', description:'Oracle Database'},
  {port:2181, protocol:'TCP', service:'Zookeeper', description:'Apache Zookeeper'},
  {port:2375, protocol:'TCP', service:'Docker', description:'Docker daemon (unencrypted)'},
  {port:2376, protocol:'TCP', service:'Docker', description:'Docker daemon (TLS)'},
  {port:3000, protocol:'TCP', service:'Dev', description:'Common dev server port'},
  {port:3306, protocol:'TCP', service:'MySQL', description:'MySQL database'},
  {port:3389, protocol:'TCP', service:'RDP', description:'Remote Desktop Protocol'},
  {port:4200, protocol:'TCP', service:'Angular', description:'Angular CLI dev server'},
  {port:5000, protocol:'TCP', service:'Dev', description:'Flask / common dev port'},
  {port:5432, protocol:'TCP', service:'PostgreSQL', description:'PostgreSQL database'},
  {port:5672, protocol:'TCP', service:'AMQP', description:'RabbitMQ AMQP'},
  {port:6379, protocol:'TCP', service:'Redis', description:'Redis'},
  {port:6443, protocol:'TCP', service:'K8s', description:'Kubernetes API server'},
  {port:8080, protocol:'TCP', service:'HTTP-ALT', description:'HTTP alternate / proxy'},
  {port:8443, protocol:'TCP', service:'HTTPS-ALT', description:'HTTPS alternate'},
  {port:8888, protocol:'TCP', service:'Jupyter', description:'Jupyter Notebook'},
  {port:9000, protocol:'TCP', service:'Dev', description:'PHP-FPM / SonarQube'},
  {port:9090, protocol:'TCP', service:'Prometheus', description:'Prometheus metrics'},
  {port:9200, protocol:'TCP', service:'Elasticsearch', description:'Elasticsearch HTTP'},
  {port:9300, protocol:'TCP', service:'Elasticsearch', description:'Elasticsearch transport'},
  {port:15672, protocol:'TCP', service:'RabbitMQ', description:'RabbitMQ management UI'},
  {port:27017, protocol:'TCP', service:'MongoDB', description:'MongoDB'},
  {port:27018, protocol:'TCP', service:'MongoDB', description:'MongoDB shard'},
];

export function searchPorts(query: string): PortEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return PORT_TABLE;
  return PORT_TABLE.filter(e =>
    e.port.toString().includes(q) ||
    e.service.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.protocol.toLowerCase().includes(q)
  );
}

// ─── A2. IP Address Classifier ────────────────────────────────────────────────

export type IpClass = 'Loopback' | 'Private (Class A)' | 'Private (Class B)' | 'Private (Class C)' | 'Link-Local' | 'Multicast' | 'Broadcast' | 'Reserved' | 'Public';

export function classifyIpv4(ip: string): {class: IpClass; description: string; range: string} {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) throw new Error('Invalid IPv4 address');
  const [a, b] = parts;
  if (a === 127) return {class:'Loopback', description:'Reserved for loopback (localhost)', range:'127.0.0.0/8'};
  if (a === 10) return {class:'Private (Class A)', description:'RFC 1918 private network', range:'10.0.0.0/8'};
  if (a === 172 && b >= 16 && b <= 31) return {class:'Private (Class B)', description:'RFC 1918 private network', range:'172.16.0.0/12'};
  if (a === 192 && b === 168) return {class:'Private (Class C)', description:'RFC 1918 private network', range:'192.168.0.0/16'};
  if (a === 169 && b === 254) return {class:'Link-Local', description:'APIPA link-local address', range:'169.254.0.0/16'};
  if (a >= 224 && a <= 239) return {class:'Multicast', description:'IP multicast address', range:'224.0.0.0/4'};
  if (ip === '255.255.255.255') return {class:'Broadcast', description:'Limited broadcast address', range:'255.255.255.255/32'};
  if (a >= 240) return {class:'Reserved', description:'Reserved for future use', range:'240.0.0.0/4'};
  return {class:'Public', description:'Publicly routable IP address', range:'0.0.0.0/0'};
}

export function formatIpClassification(ip: string): string {
  const r = classifyIpv4(ip);
  return `Class:       ${r.class}\nDescription: ${r.description}\nRange:       ${r.range}`;
}
