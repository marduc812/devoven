// ─── License Chooser Logic ────────────────────────────────────────────────────

export type License = {
  id: string;
  name: string;
  spdx: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
  useCases: string;
  compatible: string[];
  copyleft: 'none' | 'weak' | 'strong' | 'network';
  patent: boolean;
  commercial: boolean;
  privateUse: boolean;
  shareCode: boolean;
  fullText?: string;
};

export type NeedsAnswer = {
  commercial: boolean;
  shareCode: boolean;
  patent: boolean;
  modifications: 'keep-open' | 'allow-closed' | 'any';
  network: boolean;
};

export const LICENSES: License[] = [
  {
    id: 'mit',
    name: 'MIT License',
    spdx: 'MIT',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Private use'],
    conditions: ['License and copyright notice'],
    limitations: ['Liability', 'Warranty'],
    useCases: 'Most permissive common license. Ideal for libraries and open-source projects where maximum adoption matters.',
    compatible: ['GPL-2.0', 'GPL-3.0', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'],
    copyleft: 'none',
    patent: false,
    commercial: true,
    privateUse: true,
    shareCode: false,
    fullText: `MIT License

Copyright (c) [year] [author]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  },
  {
    id: 'apache-2.0',
    name: 'Apache License 2.0',
    spdx: 'Apache-2.0',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Patent use', 'Private use'],
    conditions: ['License and copyright notice', 'State changes', 'Disclose source (for distributed modified versions)'],
    limitations: ['Liability', 'Trademark use', 'Warranty'],
    useCases: 'Good for corporate/enterprise projects. Includes explicit patent grant — protects users from patent litigation.',
    compatible: ['GPL-3.0', 'MIT'],
    copyleft: 'none',
    patent: true,
    commercial: true,
    privateUse: true,
    shareCode: false,
    fullText: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  },
  {
    id: 'gpl-2.0',
    name: 'GNU GPL v2',
    spdx: 'GPL-2.0-only',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Private use'],
    conditions: ['Disclose source', 'License and copyright notice', 'Same license (strong copyleft)', 'State changes'],
    limitations: ['Liability', 'Warranty'],
    useCases: 'Strong copyleft. Modifications must be open-source. Used by Linux kernel. Prevents proprietary forks.',
    compatible: ['LGPL-2.1'],
    copyleft: 'strong',
    patent: false,
    commercial: true,
    privateUse: true,
    shareCode: true,
  },
  {
    id: 'gpl-3.0',
    name: 'GNU GPL v3',
    spdx: 'GPL-3.0-only',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Patent use', 'Private use'],
    conditions: ['Disclose source', 'License and copyright notice', 'Same license', 'State changes'],
    limitations: ['Liability', 'Warranty'],
    useCases: 'Stronger than GPL v2 — adds patent protection. Any derivative must remain GPL v3. Good for ensuring freedom.',
    compatible: ['AGPL-3.0', 'LGPL-3.0'],
    copyleft: 'strong',
    patent: true,
    commercial: true,
    privateUse: true,
    shareCode: true,
    fullText: `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.`,
  },
  {
    id: 'lgpl',
    name: 'GNU LGPL v2.1',
    spdx: 'LGPL-2.1-only',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Private use'],
    conditions: ['Disclose source', 'License and copyright notice', 'Same license (library)', 'State changes'],
    limitations: ['Liability', 'Warranty'],
    useCases: 'Weak copyleft. Libraries can be used by proprietary software as long as the library itself stays LGPL.',
    compatible: ['GPL-2.0', 'GPL-3.0'],
    copyleft: 'weak',
    patent: false,
    commercial: true,
    privateUse: true,
    shareCode: false,
  },
  {
    id: 'bsd-2',
    name: 'BSD 2-Clause',
    spdx: 'BSD-2-Clause',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Private use'],
    conditions: ['License and copyright notice'],
    limitations: ['Liability', 'Warranty'],
    useCases: 'Very permissive, similar to MIT. Used by FreeBSD. Just preserve copyright notices.',
    compatible: ['GPL-3.0', 'MIT', 'Apache-2.0'],
    copyleft: 'none',
    patent: false,
    commercial: true,
    privateUse: true,
    shareCode: false,
  },
  {
    id: 'bsd-3',
    name: 'BSD 3-Clause',
    spdx: 'BSD-3-Clause',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Private use'],
    conditions: ['License and copyright notice'],
    limitations: ['Liability', 'Warranty', 'No endorsement use of author name'],
    useCases: 'Like BSD 2-Clause but adds a non-endorsement clause. Prevents using author\'s name in promotion.',
    compatible: ['GPL-3.0', 'MIT', 'Apache-2.0'],
    copyleft: 'none',
    patent: false,
    commercial: true,
    privateUse: true,
    shareCode: false,
    fullText: `BSD 3-Clause License

Copyright (c) [year], [author]

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.`,
  },
  {
    id: 'isc',
    name: 'ISC License',
    spdx: 'ISC',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Private use'],
    conditions: ['License and copyright notice'],
    limitations: ['Liability', 'Warranty'],
    useCases: 'Functionally identical to MIT/BSD 2-Clause. Simpler text. Common in npm ecosystem.',
    compatible: ['MIT', 'GPL-3.0', 'Apache-2.0'],
    copyleft: 'none',
    patent: false,
    commercial: true,
    privateUse: true,
    shareCode: false,
    fullText: `ISC License

Copyright (c) [year] [author]

Permission to use, copy, modify, and distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright
notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`,
  },
  {
    id: 'mpl-2.0',
    name: 'Mozilla Public License 2.0',
    spdx: 'MPL-2.0',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Patent use', 'Private use'],
    conditions: ['Disclose source (file-level)', 'License and copyright notice', 'Same license (file-level)'],
    limitations: ['Liability', 'Trademark use', 'Warranty'],
    useCases: 'File-level copyleft. Modified files must stay MPL, but can be combined with proprietary code. Used by Firefox.',
    compatible: ['GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'Apache-2.0'],
    copyleft: 'weak',
    patent: true,
    commercial: true,
    privateUse: true,
    shareCode: false,
  },
  {
    id: 'agpl-3.0',
    name: 'GNU AGPL v3',
    spdx: 'AGPL-3.0-only',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Patent use', 'Private use'],
    conditions: ['Disclose source', 'License and copyright notice', 'Network use = distribution', 'Same license', 'State changes'],
    limitations: ['Liability', 'Warranty'],
    useCases: 'Like GPL v3 but also covers SaaS/network use. Running modified code on a server requires sharing source. Used by MongoDB, Grafana.',
    compatible: ['GPL-3.0'],
    copyleft: 'network',
    patent: true,
    commercial: true,
    privateUse: true,
    shareCode: true,
  },
  {
    id: 'unlicense',
    name: 'The Unlicense',
    spdx: 'Unlicense',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Private use'],
    conditions: [],
    limitations: ['Liability', 'Warranty'],
    useCases: 'Essentially public domain. No conditions whatsoever. If you want no strings attached.',
    compatible: ['MIT', 'GPL-3.0', 'Apache-2.0'],
    copyleft: 'none',
    patent: false,
    commercial: true,
    privateUse: true,
    shareCode: false,
  },
  {
    id: 'cc0',
    name: 'CC0 1.0 Universal',
    spdx: 'CC0-1.0',
    permissions: ['Commercial use', 'Distribution', 'Modification', 'Private use'],
    conditions: [],
    limitations: ['Patent use', 'Trademark use', 'Liability', 'Warranty'],
    useCases: 'Public domain dedication. No copyright. Best for datasets, creative works, documentation. Not recommended for software.',
    compatible: ['MIT', 'GPL-3.0', 'Apache-2.0'],
    copyleft: 'none',
    patent: false,
    commercial: true,
    privateUse: true,
    shareCode: false,
  },
];

export function suggestLicenses(needs: NeedsAnswer): License[] {
  return LICENSES.filter(l => {
    if (needs.commercial && !l.commercial) return false;
    if (needs.patent && !l.patent) return false;
    if (needs.network && l.copyleft !== 'network') {
      // If they want network copyleft, only AGPL qualifies
      // but if they DON'T want network copyleft, exclude AGPL
    }
    if (!needs.network && l.copyleft === 'network') return false;
    if (needs.shareCode && l.copyleft === 'none') return false;
    if (!needs.shareCode && l.copyleft === 'strong') return false;
    if (needs.modifications === 'allow-closed' && l.copyleft !== 'none') return false;
    if (needs.modifications === 'keep-open' && l.copyleft === 'none') return false;
    return true;
  });
}

export function formatLicenseSummary(l: License): string {
  const lines: string[] = [
    `# ${l.name} (${l.spdx})`,
    '',
    `## Use Case`,
    l.useCases,
    '',
    `## Permissions`,
    ...l.permissions.map(p => `  ✅ ${p}`),
    '',
    `## Conditions`,
    l.conditions.length > 0 ? l.conditions.map(c => `  ⚠️  ${c}`).join('\n') : '  (none)',
    '',
    `## Limitations`,
    ...l.limitations.map(li => `  ❌ ${li}`),
    '',
    `## Compatible With`,
    l.compatible.length > 0 ? l.compatible.join(', ') : 'Various',
    '',
    `## Details`,
    `  Patent grant:      ${l.patent ? 'Yes' : 'No'}`,
    `  Copyleft strength: ${l.copyleft}`,
    `  Commercial use:    ${l.commercial ? 'Yes' : 'No'}`,
  ];

  if (l.fullText) {
    lines.push('', '## License Text', '', l.fullText);
  }

  return lines.join('\n');
}

export function getLicenseById(id: string): License | undefined {
  return LICENSES.find(l => l.id === id);
}
