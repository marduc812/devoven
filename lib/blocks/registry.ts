import { Operation } from './types';
import { encodingOperations } from './operations/encoding';
import { newEncodingOperations } from './operations/encoding-new';
import { encodingExtraOperations } from './operations/encoding-extra';
import { cipherOperations } from './operations/ciphers';
import { hashingOperations } from './operations/hashing';
import { hashingExtraOperations } from './operations/hashing-extra';
import { conversionOperations } from './operations/conversion';
import { dataFormatOperations } from './operations/data-format';
import { dataExtraOperations } from './operations/data-extra';
import { textUtilsOperations } from './operations/text-utils';
import { textExtraOperations } from './operations/text-extra';
import { networkOperations } from './operations/network';
import { analysisOperations } from './operations/analysis';
import { compressionOperations } from './operations/compression';
import { binaryOperations } from './operations/binary';

export const OPERATIONS: Operation[] = [
  ...encodingOperations,
  ...newEncodingOperations,
  ...encodingExtraOperations,
  ...cipherOperations,
  ...hashingOperations,
  ...hashingExtraOperations,
  ...conversionOperations,
  ...dataFormatOperations,
  ...dataExtraOperations,
  ...textUtilsOperations,
  ...textExtraOperations,
  ...networkOperations,
  ...analysisOperations,
  ...compressionOperations,
  ...binaryOperations,
];

export const OPERATION_MAP: Record<string, Operation> = Object.fromEntries(
  OPERATIONS.map((op) => [op.id, op])
);
