import { WsFrameDecoder } from '@/Components/Functions/WsFrameTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/network/ws-frame', { title: 'WebSocket Frame Decoder', description: 'Decode WebSocket frames from hex bytes (RFC 6455). Parse FIN, RSV bits, opcode, MASK, payload length, masking key, and payload data.' });
const page = () => <WsFrameDecoder />;
export default page;
