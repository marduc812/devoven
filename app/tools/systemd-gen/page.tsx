import type { Metadata } from 'next';
import { SystemdUnitGenerator } from '@/Components/Functions/SystemdGenTools';

export const metadata: Metadata = {
  title: 'Systemd Unit File Generator | DevOven',
  description: 'Generate complete systemd .service unit files with support for simple, oneshot, forking, and notify service types. Configure ExecStart, User, Restart, Environment, and dependency directives.',
};

export default function Page() {
  return <SystemdUnitGenerator />;
}
