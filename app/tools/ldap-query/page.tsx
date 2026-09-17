import type { Metadata } from 'next';
import { LdapQueryBuilder } from '@/Components/Functions/LdapQueryTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/ldap-query', {
  title: 'LDAP Query Builder | DevOven',
  description: 'Build LDAP filter syntax from natural language descriptions. Supports AND, OR, NOT operators, wildcards, objectClass, cn, department, email, group membership, and account status.',
});

export default function Page() {
  return <LdapQueryBuilder />;
}
