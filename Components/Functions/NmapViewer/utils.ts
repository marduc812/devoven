import { XMLParser } from "fast-xml-parser";
import { HostAddressType, HostType, HostnameType, NmapRunType, PortScriptType, PortType, PortsType, ScanInfoType } from "./types";

/**
 * Returns the parsed XML content to itterate on each host
 * @param nmapScan - string with the XML of nmap
 * @returns - parsed Object of Nmap | null
 */
export const parseNmapScan = (nmapScan: string): NmapRunType | null => {
    const parsingOptions = {
        ignoreAttributes: false,
        ignoreNameSpace: false
    };
    const xmlParser = new XMLParser(parsingOptions);
    try {
        const parsedContent: NmapRunType = xmlParser.parse(nmapScan);
        return parsedContent;
    } catch (error) {
        return null;
    }
};


/**
 * Returns values for ipv4, ipv6 and mac address
 * @param scanAddresses - Array of addresses and assigs each to it's category
 * @returns - returns values for each ipv4, ipv6 and mac address
 */
export const getAddresses = (scanAddresses: HostAddressType[]) => {

    let ipv4 = "";
    let mac = "";
    let ipv6 = "";

    scanAddresses.forEach((address) => {
        if (address["@_addrtype"] === 'mac') {
            mac = address["@_addr"];
        } else if (address["@_addrtype"] === 'ipv4') {
            ipv4 = address["@_addr"];
        } else if (address["@_addrtype"] === 'ipv6') {
            ipv6 = address["@_addr"];
        }
    });

    return { ipv4: ipv4, ipv6: ipv6, mac: mac };
};


/**
 * Returns all the hostnames in form of a single string
 * @param scanHostnames - hostnames field of nmap. Can have some or even be empty
 * @returns {string} - list of hosts
 */
export const getHostnames = (scanHostnames: any): string => {
    let hostnames: string[] = [];

    if (!Array.isArray(scanHostnames)) {
        hostnames = [scanHostnames];
    } else {
        hostnames = scanHostnames;
    }

    let hostnamesList = new Set();
    hostnames.forEach((hostname: any) => {
        if (typeof (hostname) === 'string') {
            hostnamesList.add(hostname);
        } else {
            // Check if hostname and its property exist before accessing '@_name'
            if (hostname && hostname.hostname) {
                if (typeof hostname.hostname === 'string') {
                    hostnamesList.add(hostname.hostname);
                } else if (hostname.hostname['@_name']) {
                    hostnamesList.add(hostname.hostname['@_name']);
                }

                if (Array.isArray(hostname.hostname)) {
                    let hostnamesSet = new Set();
                    hostname.hostname.forEach((hostnameItem: HostnameType) => {
                        if (hostnameItem && hostnameItem['@_name']) {
                            hostnamesSet.add(hostnameItem['@_name']);
                        }
                    });

                    let hostnamesArray = Array.from(hostnamesSet);
                    if (hostnamesArray.length === 1) {
                        hostnamesList.add(hostnamesArray[0]);
                    } else {
                        hostnamesList.add(hostnamesArray.join(', '));
                    }
                }
            }
            // Anything else is not a shape we recognise, so it is skipped.
        }
    });

    const uniqueHostnamesList = [...new Set(hostnamesList)];
    return uniqueHostnamesList.join(', ');
};



/**
 * Returns the nuymber of ports and the ports of each host
 * @param scanPorts - Takes the ports field from the nmap scan object
 * @returns {string[]} - An array with the ports of the scope
 */
export const generatePortScanInfo = (scanPorts: any): {number: string, state: string}[] => {
    let ports: {number: string, state: string}[] = [];

    if (scanPorts && scanPorts.port) {
        // Many ports are present
        if (Array.isArray(scanPorts.port)) {
            scanPorts.port.forEach((port: PortType) => {
                if (port && port['@_portid']) {
                    ports.push({number: port['@_portid'], state: port.state["@_state"]});
                }
            });
        } else if (typeof scanPorts.port === 'object') {
            // There is a single port
            if (scanPorts.port['@_portid']) {
                ports.push({number: scanPorts.port['@_portid'], state: scanPorts.port.state["@_state"]});
            }
        }
    }

    return ports;
};

/**
 * Detects the OS based on the OS tag if it is present. 
 * @param scanHost - The Host Object
 * @returns {vendor: string, family: string} - which shows the vendot and the family of the OS.
 */
export const findOS = (scanHost: HostType): { vendor: string, family: string } => {
    // fast-xml-parser collapses a single <osmatch>/<osclass> into a bare object
    // rather than a one-element array, so normalise before taking the best match.
    const osmatches = scanHost.os?.osmatch
        ? (Array.isArray(scanHost.os.osmatch) ? scanHost.os.osmatch : [scanHost.os.osmatch])
        : [];
    const osmatch = osmatches[0] ?? null;

    const osclasses = osmatch?.osclass
        ? (Array.isArray(osmatch.osclass) ? osmatch.osclass : [osmatch.osclass])
        : [];
    const osclass = osclasses[0] ?? null;

    let vendor = osclass && osclass['@_vendor'] ? osclass['@_vendor'] : '?';
    let family = osclass && osclass['@_osfamily'] ? osclass['@_osfamily'] : '?';

    if (vendor === '?' && family === '?') {
        const detectedOS = getOSFromPorts(scanHost.ports);
        if (detectedOS !== '') {
            vendor = '';
            family = detectedOS;
        }
    }

    return { vendor, family };
};

/**
 * Detectes the OS of the host based on service info
 * @param ports - The ports object of the host
 * @returns the OS or empty string if nothing was found.
 */
const getOSFromPorts = (ports: PortsType) => {
    if (!ports || !ports.port) {
        return '';
    }

    const portsArray = Array.isArray(ports.port) ? ports.port : [ports.port];

    for (const port of portsArray) {
        if (port && port.service && port.service["@_ostype"]) {
            return port.service["@_ostype"];
        }
    }

    return '';
};




/**
 * fast-xml-parser resolves named entities but leaves numeric character
 * references alone. Nmap escapes newlines and other control characters in
 * script output as &#xa; / &#10;, so decode them or the output renders as one
 * long line with literal entity text in it.
 */
export const decodeNumericEntities = (value: string): string => {
    if (typeof value !== 'string') return '';

    return value.replace(/&#(x[0-9a-fA-F]+|[0-9]+);/gi, (match, code: string) => {
        const point = code[0].toLowerCase() === 'x'
            ? parseInt(code.slice(1), 16)
            : parseInt(code, 10);

        if (!Number.isFinite(point) || point < 0 || point > 0x10ffff) return match;
        return String.fromCodePoint(point);
    });
};


/**
 * Returns information from the scripts as a single string
 * @param scanScript
 * @returns {in: string, out: string}[] - Object with in and out of script executions
 */
export const getScripts = (scanScript: PortScriptType[]): PortScriptType[] => {
    if (scanScript === undefined) {
        return [{ "@_id": "", "@_output": "" }];
    }
    let scriptsArray: { "@_id": string, "@_output": string }[] = [];

    if (Array.isArray(scanScript)) {
        scanScript.forEach((script: PortScriptType) => {
            scriptsArray.push({ "@_id": script["@_id"], "@_output": decodeNumericEntities(script["@_output"]) });
        });
    } else if (typeof (scanScript) === 'object') {
        // there is single script
        scriptsArray.push({ "@_id": scanScript["@_id"], "@_output": decodeNumericEntities(scanScript["@_output"]) });
    }

    return scriptsArray;
};


/**
 * Geths the CPE information and returns it in form of a single string
 * @param scanCPE 
 * @returns {string} - String with values from the CPE fields
 */
export const getCPE = (scanCPE: string | string[]): string => {
    let cpes: string[] = [];

    if (!Array.isArray(scanCPE)) {
        cpes = [scanCPE];
    } else {
        cpes = scanCPE;
    }

    let cpesList: string[] = [];
    cpes.forEach((cpe: any) => {
        cpesList.push(cpe);
    });

    const uniqueCpeList = [...new Set(cpesList)];
    return uniqueCpeList.join(', ');
};

export const filterPort = (ports: PortsType, query: string, filter: string): boolean => {
    if (!ports || !ports.port) {
        return false;
    }

    const normalizedPorts = Array.isArray(ports.port) ? ports.port : [ports.port];


    const lowerCaseQuery = query.toLowerCase();

    return normalizedPorts.some(port => {
        const state = port?.state?.["@_state"] ?? '';
        const serviceName = port?.service?.['@_name'] ?? '';
        const serviceOSType = port?.service?.['@_ostype'] ?? '';
        const serviceProduct = port?.service?.['@_product'] ?? '';
        const serviceVersion = port?.service?.['@_version'] ?? '';
        const serviceCPE = port?.service?.cpe ? getCPE(port.service.cpe) : '';
        const protocol = port?.["@_protocol"] ?? '';
        const portId = port?.["@_portid"] ?? '';
        const script = port?.script ? getScripts(port.script) : '';

        switch(filter) {
            case "state":
                return state.includes(lowerCaseQuery);

            case "pnumber":
                return portId === lowerCaseQuery;

            case "pscript":
                return scriptContains(script, lowerCaseQuery);

            case "sname":
                return serviceName.includes(lowerCaseQuery);
            
            case "protocol":
                return protocol === lowerCaseQuery;

            case "port":
                return serviceName.toLowerCase().includes(lowerCaseQuery) ||
                    serviceOSType.toLowerCase().includes(lowerCaseQuery) ||
                    serviceProduct.toLowerCase().includes(lowerCaseQuery) ||
                    serviceVersion.toLowerCase().includes(lowerCaseQuery) ||
                    serviceCPE.toLowerCase().includes(lowerCaseQuery);

            default:
                return state.toLowerCase().includes(lowerCaseQuery) ||
                    serviceName.toLowerCase().includes(lowerCaseQuery) ||
                    serviceOSType.toLowerCase().includes(lowerCaseQuery) ||
                    serviceProduct.toLowerCase().includes(lowerCaseQuery) ||
                    serviceVersion.toLowerCase().includes(lowerCaseQuery) ||
                    serviceCPE.toLowerCase().includes(lowerCaseQuery) ||
                    protocol.toLowerCase().includes(lowerCaseQuery) ||
                    portId.toLowerCase().includes(lowerCaseQuery) ||
                    scriptContains(script, lowerCaseQuery);
        }
    });
};


export const scriptContains = (scripts: PortScriptType[] | "", query: string) : boolean => {
    if (scripts === "") {
        return false;
    }

    return scripts.some(script => {
        return script["@_output"].toLowerCase().includes(query);
    });
}; 


export const generateHTML = async (title: string, hosts: HostType | HostType[]): Promise<string> => {
    const response = await fetch('/Templates/nmapreport.html');
    let htmlResponse = await response.text();
    const htmlContent: string[] = [];

    const hostsInformationContent: string[] = [];
    const hostsInformationTableHTMLStart: string = `
    <h2 class="section-title">Hosts Scanned</h2>
    <div class="host-view">
    <table id="all_hosts_table">
        <thead>
            <tr>
                <th>Status</th>
                <th>IP</th>
                <th>Hostname</th>
                <th>Open Ports</th>
                <th>OS</th>
            </tr>
        </thead>
        <tbody>`;
    hostsInformationContent.push(hostsInformationTableHTMLStart);

    // Contains the scripts to set the DataTable for jQuery so they will be interactive
    const htmlHostsDatasetScripts: string[] = []

    const hostsArray = Array.isArray(hosts) ? hosts : [hosts];

    hostsArray.forEach((host) => {
        const addresses = Array.isArray(host.address) ? host.address : [host.address];
        const parsedAddress = getAddresses(addresses);

        const ip = parsedAddress.ipv4;
        const status = host.status['@_state']
        const ipv6 = parsedAddress.ipv6;
        const mac = parsedAddress.mac;

        const hostnames = getHostnames(host.hostnames);

        const ports = generatePortScanInfo(host.ports);
        console.log(ports);
        const os: { vendor: string, family: string } = findOS(host);

        const statusStyle = host.status['@_state'] === "up" ? `<p><span class="host-up">${status}</span></p>` : `<p><span class="host-down">${status}</span></p>`;
        
        const hostInfo = `
        <tr>
            <td>${statusStyle}</td>
            <td><a href="#${ip.replace(/\./g, "_")}">${ip}</a></td>
            <td>${hostnames}</td>
            <td>${ports.length}</td>
            <td>${os.vendor} ${os.family}</td>
        </tr>`;

        hostsInformationContent.push(hostInfo);
        htmlHostsDatasetScripts.push(`$('#host-${ip.replace(/\./g, "_")}-table').DataTable({ language: { search: '', searchPlaceholder: "Search..." }});`)

        htmlContent.push(generateHTMLHostContent(ip, status, ipv6, mac, hostnames, host.ports, os));
    });

    hostsInformationContent.push('</tbody></table></div>');

    const htmlContentString = htmlContent.join('\n');
    const htmlHostsInfo = hostsInformationContent.join('\n');
    

    const hostsSectionTitle = '<h2 class="section-title">Hosts</h2>'

    htmlResponse = htmlResponse.replace('{{page-title}}', title);
    htmlResponse = htmlResponse.replace('{{content}}', htmlHostsInfo + hostsSectionTitle + htmlContentString);
    htmlResponse = htmlResponse.replace('//{{extra_loads}}',htmlHostsDatasetScripts.join('\n'));


    return htmlResponse;
}

const generateHTMLHostContent = (ip: string, status: string, ipv6: string, mac: string, hostnames: string, ports: PortsType, os: { vendor: string, family: string }): string => {

    const hostnamesView = hostnames !== '' ? `(${hostnames})` : ''
    const ipv6view = ipv6 !== '' ? `<span style="">IPv6:</span>${ipv6}` : '' ;
    const macview = mac !== '' ? `<span style="">MAC:</span>${mac}` : '' ;
    
    const portsView = status === 'up' ?  generateHTMLPortsContent(ip, ports) : '';
    const statusView = status === 'up' ?  `<span class="host-up">up</span>` : `<span class="down-up">down</span>` ;
    const hostTitleView = status === 'up' ?  `host-title-up` : `host-title-up` ;

    const contentView = `
        <div id="${ip.replace(/\./g, "_")}" class="host-view">
            <h3 class="host-title ${hostTitleView}"> ${ip} ${hostnamesView}</h3>
            <div class="host-info-section">
                <ul>
                    <li><p><span style="font-weight:bold;">Status:</span> ${statusView}</p></li>
                    <li><p><span style="font-weight:bold;">Additional Addresses:</span> ${ipv6view} ${macview}</p></li>
                </ul>
            </div>
            
            <div>
                <h4 class="ports-section-title">Ports</h4>
                ${portsView}
            </div>

            
        </div>
    `;

    return contentView
};


const generateHTMLPortsContent = (ip: string, ports:PortsType) => {

    const portsView: string[] = [];

    const portTableView = `
    <table id="host-${ip.replace(/\./g, "_")}-table">
        <thead>
            <tr>
                <th>Port</th>
                <th>State</th>
                <th>Service</th>
                <th>Product</th>
                <th>Version</th>
                <th>Extra Info</th>
            </tr>
        </thead>
        <tbody>`;


    portsView.push(portTableView);

    if (ports && Array.isArray(ports.port)) {
        ports.port.forEach((port) => {

            const serviceName = port.service?.["@_name"] !== undefined ? port.service?.["@_name"] : '';
            const serviceProduct = port.service?.["@_product"] !== undefined ? port.service?.["@_product"] : '';
            const serviceVersion = port.service?.["@_version"] !== undefined ? port.service?.["@_version"] : '';
            const serviceExtraInfo = port.service?.["@_extrainfo"] !== undefined ? port.service?.["@_extrainfo"] : '';
    
    
            const portView = `
            <tr>
                <td><p><span style="font-weight: bold;">${port["@_portid"]}</span></p></td>
                <td>${port.state["@_state"]}</td>
                <td>${serviceName}</td>
                <td>${serviceProduct}</td>
                <td>${serviceVersion}</td>
                <td>${serviceExtraInfo}</td>
            </tr>
            `;
    
            portsView.push(portView);
        });
    } else {
        console.error("Invalid or undefined ports data");
    }

    portsView.push('</tbody></table>');
    return portsView.join('\n');
}


