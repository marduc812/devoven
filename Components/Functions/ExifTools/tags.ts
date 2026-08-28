/**
 * EXIF/TIFF tag dictionaries and enumerated value maps.
 *
 * Tag ids are only unique within a directory — GPS tag 0x0001 is
 * GPSLatitudeRef, while IFD0 tag 0x0001 means nothing — so lookups are always
 * scoped to the directory the tag was read from.
 */

export type TagDictionary = Record<number, string>;

/** Baseline TIFF tags, used by IFD0 and IFD1 (thumbnail). */
export const TIFF_TAGS: TagDictionary = {
  0x00fe: 'NewSubfileType',
  0x0100: 'ImageWidth',
  0x0101: 'ImageLength',
  0x0102: 'BitsPerSample',
  0x0103: 'Compression',
  0x0106: 'PhotometricInterpretation',
  0x010e: 'ImageDescription',
  0x010f: 'Make',
  0x0110: 'Model',
  0x0111: 'StripOffsets',
  0x0112: 'Orientation',
  0x0115: 'SamplesPerPixel',
  0x0116: 'RowsPerStrip',
  0x0117: 'StripByteCounts',
  0x011a: 'XResolution',
  0x011b: 'YResolution',
  0x011c: 'PlanarConfiguration',
  0x0128: 'ResolutionUnit',
  0x012d: 'TransferFunction',
  0x0131: 'Software',
  0x0132: 'DateTime',
  0x013b: 'Artist',
  0x013e: 'WhitePoint',
  0x013f: 'PrimaryChromaticities',
  0x014a: 'SubIFDs',
  0x0201: 'JPEGInterchangeFormat',
  0x0202: 'JPEGInterchangeFormatLength',
  0x0211: 'YCbCrCoefficients',
  0x0212: 'YCbCrSubSampling',
  0x0213: 'YCbCrPositioning',
  0x0214: 'ReferenceBlackWhite',
  0x02bc: 'XMLPacket',
  0x83bb: 'IPTC/NAA',
  0x8298: 'Copyright',
  0x8649: 'PhotoshopSettings',
  0x8773: 'ICCProfile',
  0x9c9b: 'XPTitle',
  0x9c9c: 'XPComment',
  0x9c9d: 'XPAuthor',
  0x9c9e: 'XPKeywords',
  0x9c9f: 'XPSubject',
  0xc4a5: 'PrintImageMatching',
};

export const EXIF_TAGS: TagDictionary = {
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8822: 'ExposureProgram',
  0x8824: 'SpectralSensitivity',
  0x8827: 'ISOSpeedRatings',
  0x8828: 'OECF',
  0x8830: 'SensitivityType',
  0x8832: 'RecommendedExposureIndex',
  0x9000: 'ExifVersion',
  0x9003: 'DateTimeOriginal',
  0x9004: 'DateTimeDigitized',
  0x9010: 'OffsetTime',
  0x9011: 'OffsetTimeOriginal',
  0x9012: 'OffsetTimeDigitized',
  0x9101: 'ComponentsConfiguration',
  0x9102: 'CompressedBitsPerPixel',
  0x9201: 'ShutterSpeedValue',
  0x9202: 'ApertureValue',
  0x9203: 'BrightnessValue',
  0x9204: 'ExposureBiasValue',
  0x9205: 'MaxApertureValue',
  0x9206: 'SubjectDistance',
  0x9207: 'MeteringMode',
  0x9208: 'LightSource',
  0x9209: 'Flash',
  0x920a: 'FocalLength',
  0x9214: 'SubjectArea',
  0x927c: 'MakerNote',
  0x9286: 'UserComment',
  0x9290: 'SubSecTime',
  0x9291: 'SubSecTimeOriginal',
  0x9292: 'SubSecTimeDigitized',
  0xa000: 'FlashpixVersion',
  0xa001: 'ColorSpace',
  0xa002: 'PixelXDimension',
  0xa003: 'PixelYDimension',
  0xa004: 'RelatedSoundFile',
  0xa20b: 'FlashEnergy',
  0xa20e: 'FocalPlaneXResolution',
  0xa20f: 'FocalPlaneYResolution',
  0xa210: 'FocalPlaneResolutionUnit',
  0xa214: 'SubjectLocation',
  0xa215: 'ExposureIndex',
  0xa217: 'SensingMethod',
  0xa300: 'FileSource',
  0xa301: 'SceneType',
  0xa302: 'CFAPattern',
  0xa401: 'CustomRendered',
  0xa402: 'ExposureMode',
  0xa403: 'WhiteBalance',
  0xa404: 'DigitalZoomRatio',
  0xa405: 'FocalLengthIn35mmFilm',
  0xa406: 'SceneCaptureType',
  0xa407: 'GainControl',
  0xa408: 'Contrast',
  0xa409: 'Saturation',
  0xa40a: 'Sharpness',
  0xa40b: 'DeviceSettingDescription',
  0xa40c: 'SubjectDistanceRange',
  0xa420: 'ImageUniqueID',
  0xa430: 'CameraOwnerName',
  0xa431: 'BodySerialNumber',
  0xa432: 'LensSpecification',
  0xa433: 'LensMake',
  0xa434: 'LensModel',
  0xa435: 'LensSerialNumber',
  0xa460: 'CompositeImage',
};

export const GPS_TAGS: TagDictionary = {
  0x0000: 'GPSVersionID',
  0x0001: 'GPSLatitudeRef',
  0x0002: 'GPSLatitude',
  0x0003: 'GPSLongitudeRef',
  0x0004: 'GPSLongitude',
  0x0005: 'GPSAltitudeRef',
  0x0006: 'GPSAltitude',
  0x0007: 'GPSTimeStamp',
  0x0008: 'GPSSatellites',
  0x0009: 'GPSStatus',
  0x000a: 'GPSMeasureMode',
  0x000b: 'GPSDOP',
  0x000c: 'GPSSpeedRef',
  0x000d: 'GPSSpeed',
  0x000e: 'GPSTrackRef',
  0x000f: 'GPSTrack',
  0x0010: 'GPSImgDirectionRef',
  0x0011: 'GPSImgDirection',
  0x0012: 'GPSMapDatum',
  0x0013: 'GPSDestLatitudeRef',
  0x0014: 'GPSDestLatitude',
  0x0015: 'GPSDestLongitudeRef',
  0x0016: 'GPSDestLongitude',
  0x0017: 'GPSDestBearingRef',
  0x0018: 'GPSDestBearing',
  0x0019: 'GPSDestDistanceRef',
  0x001a: 'GPSDestDistance',
  0x001b: 'GPSProcessingMethod',
  0x001c: 'GPSAreaInformation',
  0x001d: 'GPSDateStamp',
  0x001e: 'GPSDifferential',
  0x001f: 'GPSHPositioningError',
};

export const INTEROP_TAGS: TagDictionary = {
  0x0001: 'InteroperabilityIndex',
  0x0002: 'InteroperabilityVersion',
  0x1000: 'RelatedImageFileFormat',
  0x1001: 'RelatedImageWidth',
  0x1002: 'RelatedImageLength',
};

/** Pointer tags, consumed by the walker rather than shown as data. */
export const EXIF_IFD_POINTER = 0x8769;
export const GPS_IFD_POINTER = 0x8825;
export const INTEROP_IFD_POINTER = 0xa005;

export const THUMBNAIL_OFFSET = 0x0201;
export const THUMBNAIL_LENGTH = 0x0202;

// ─── Enumerated values ────────────────────────────────────────────────────────

type EnumMap = Record<number, string>;

export const ORIENTATION: EnumMap = {
  1: 'Normal',
  2: 'Mirrored horizontally',
  3: 'Rotated 180°',
  4: 'Mirrored vertically',
  5: 'Mirrored horizontally, rotated 270° CW',
  6: 'Rotated 90° CW',
  7: 'Mirrored horizontally, rotated 90° CW',
  8: 'Rotated 270° CW',
};

export const RESOLUTION_UNIT: EnumMap = { 1: 'None', 2: 'Inches', 3: 'Centimetres' };

export const COLOR_SPACE: EnumMap = { 1: 'sRGB', 0xffff: 'Uncalibrated' };

export const EXPOSURE_PROGRAM: EnumMap = {
  0: 'Not defined',
  1: 'Manual',
  2: 'Normal program',
  3: 'Aperture priority',
  4: 'Shutter priority',
  5: 'Creative (slow speed)',
  6: 'Action (high speed)',
  7: 'Portrait',
  8: 'Landscape',
};

export const METERING_MODE: EnumMap = {
  0: 'Unknown',
  1: 'Average',
  2: 'Centre-weighted average',
  3: 'Spot',
  4: 'Multi-spot',
  5: 'Pattern',
  6: 'Partial',
  255: 'Other',
};

export const LIGHT_SOURCE: EnumMap = {
  0: 'Unknown',
  1: 'Daylight',
  2: 'Fluorescent',
  3: 'Tungsten',
  4: 'Flash',
  9: 'Fine weather',
  10: 'Cloudy weather',
  11: 'Shade',
  12: 'Daylight fluorescent',
  17: 'Standard light A',
  18: 'Standard light B',
  19: 'Standard light C',
  255: 'Other',
};

export const WHITE_BALANCE: EnumMap = { 0: 'Auto', 1: 'Manual' };

export const EXPOSURE_MODE: EnumMap = { 0: 'Auto', 1: 'Manual', 2: 'Auto bracket' };

export const SCENE_CAPTURE_TYPE: EnumMap = {
  0: 'Standard',
  1: 'Landscape',
  2: 'Portrait',
  3: 'Night scene',
};

export const SENSING_METHOD: EnumMap = {
  1: 'Not defined',
  2: 'One-chip colour area',
  3: 'Two-chip colour area',
  4: 'Three-chip colour area',
  5: 'Colour sequential area',
  7: 'Trilinear',
  8: 'Colour sequential linear',
};

export const CUSTOM_RENDERED: EnumMap = { 0: 'Normal', 1: 'Custom' };

export const GAIN_CONTROL: EnumMap = {
  0: 'None',
  1: 'Low gain up',
  2: 'High gain up',
  3: 'Low gain down',
  4: 'High gain down',
};

export const CONTRAST: EnumMap = { 0: 'Normal', 1: 'Soft', 2: 'Hard' };
export const SATURATION: EnumMap = { 0: 'Normal', 1: 'Low', 2: 'High' };
export const SHARPNESS: EnumMap = { 0: 'Normal', 1: 'Soft', 2: 'Hard' };

export const SUBJECT_DISTANCE_RANGE: EnumMap = {
  0: 'Unknown',
  1: 'Macro',
  2: 'Close view',
  3: 'Distant view',
};

export const COMPRESSION: EnumMap = {
  1: 'Uncompressed',
  6: 'JPEG (old style)',
  7: 'JPEG',
  8: 'Adobe Deflate',
  32773: 'PackBits',
};

export const PHOTOMETRIC_INTERPRETATION: EnumMap = {
  0: 'White is zero',
  1: 'Black is zero',
  2: 'RGB',
  3: 'Palette',
  6: 'YCbCr',
};

export const PLANAR_CONFIGURATION: EnumMap = { 1: 'Chunky', 2: 'Planar' };

export const YCBCR_POSITIONING: EnumMap = { 1: 'Centred', 2: 'Co-sited' };

export const GPS_ALTITUDE_REF: EnumMap = { 0: 'Above sea level', 1: 'Below sea level' };

export const FILE_SOURCE: EnumMap = {
  1: 'Film scanner',
  2: 'Reflection print scanner',
  3: 'Digital camera',
};

export const SCENE_TYPE: EnumMap = { 1: 'Directly photographed' };

export const SENSITIVITY_TYPE: EnumMap = {
  0: 'Unknown',
  1: 'Standard output sensitivity',
  2: 'Recommended exposure index',
  3: 'ISO speed',
  4: 'SOS and REI',
  5: 'SOS and ISO speed',
  6: 'REI and ISO speed',
  7: 'SOS, REI and ISO speed',
};

/** Enumerated tags, keyed by directory then tag id. */
export const ENUM_TAGS: Record<string, Record<number, EnumMap>> = {
  tiff: {
    0x0103: COMPRESSION,
    0x0106: PHOTOMETRIC_INTERPRETATION,
    0x0112: ORIENTATION,
    0x011c: PLANAR_CONFIGURATION,
    0x0128: RESOLUTION_UNIT,
    0x0213: YCBCR_POSITIONING,
  },
  exif: {
    0x8822: EXPOSURE_PROGRAM,
    0x8830: SENSITIVITY_TYPE,
    0x9207: METERING_MODE,
    0x9208: LIGHT_SOURCE,
    0xa001: COLOR_SPACE,
    0xa210: RESOLUTION_UNIT,
    0xa217: SENSING_METHOD,
    0xa300: FILE_SOURCE,
    0xa301: SCENE_TYPE,
    0xa401: CUSTOM_RENDERED,
    0xa402: EXPOSURE_MODE,
    0xa403: WHITE_BALANCE,
    0xa406: SCENE_CAPTURE_TYPE,
    0xa407: GAIN_CONTROL,
    0xa408: CONTRAST,
    0xa409: SATURATION,
    0xa40a: SHARPNESS,
    0xa40c: SUBJECT_DISTANCE_RANGE,
  },
  gps: {
    0x0005: GPS_ALTITUDE_REF,
  },
  interop: {},
};

/**
 * Flash is a bit field, not a plain enumeration: bit 0 fired, bits 1-2 return
 * detection, bits 3-4 mode, bit 5 flash present, bit 6 red-eye.
 */
export function describeFlash(value: number): string {
  const parts: string[] = [(value & 0x01) ? 'Fired' : 'Did not fire'];
  if (!(value & 0x20)) {
    const mode = (value >> 3) & 0x03;
    if (mode === 1) parts.push('compulsory firing');
    else if (mode === 2) parts.push('compulsory suppression');
    else if (mode === 3) parts.push('auto mode');
    const ret = (value >> 1) & 0x03;
    if (ret === 2) parts.push('no return light detected');
    else if (ret === 3) parts.push('return light detected');
    if (value & 0x40) parts.push('red-eye reduction');
  } else {
    parts.push('no flash function');
  }
  return parts.join(', ');
}
