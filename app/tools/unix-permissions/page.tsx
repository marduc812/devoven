import type { Metadata } from 'next';
import { UnixPermissions } from '@/Components/Functions/UnixPermissionsTools';

export const metadata: Metadata = {
  title: 'Unix File Permissions Calculator | DevOven',
  description: 'Convert Unix file permissions between octal (755) and symbolic (rwxr-xr-x) notation. View visual owner/group/other breakdown and explore common permission values.',
};

export default function Page() {
  return <UnixPermissions />;
}
