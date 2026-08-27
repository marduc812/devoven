import { WsFrameDecoder } from '@/Components/Functions/WsFrameTools';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'WebSocket Frame Decoder', description: 'Decode WebSocket frames from hex bytes (RFC 6455). Parse FIN, RSV bits, opcode, MASK, payload length, masking key, and payload data.' };
const page = () => <WsFrameDecoder />;
export default page;
