'use client';

import { useState, useRef } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  clampQuality,
  getMimeType,
  validateBase64DataUri,
  getScaledDimensions,
  formatFileSize,
  getCropParams,
  getRotationDegrees,
  buildIcoFile,
} from './logic';

// ─── Shared internal types ────────────────────────────────────────────────────

interface ConvertState {
  preview: string;
  downloadUrl: string;
  fileName: string;
  error: string;
}

// ─── 1. PNG to JPG ────────────────────────────────────────────────────────────

export function PngToJpg() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [quality, setQuality] = useState(92);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      // Fill white background (JPG has no transparency)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const jpgUrl = canvas.toDataURL(getMimeType('jpg'), clampQuality(quality));
      setState({
        preview: jpgUrl,
        downloadUrl: jpgUrl,
        fileName: file.name.replace(/\.png$/i, '.jpg'),
        error: '',
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  return (
    <Panel
      title="PNG to JPG Converter"
      description="Convert PNG images to JPG format. Transparency is replaced with a white background. Use the quality slider to balance file size and image quality."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select PNG file</span>
            <input
              type="file"
              accept="image/png"
              onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quality: {quality}%</span>
            <input
              type="range" min={1} max={100} value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              className="accent-gray-900"
            />
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && (
            <p className="text-red-600 text-sm">{state.error}</p>
          )}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a
                href={state.downloadUrl}
                download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 2. JPG to PNG ────────────────────────────────────────────────────────────

export function JpgToPng() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL(getMimeType('png'));
      setState({
        preview: pngUrl,
        downloadUrl: pngUrl,
        fileName: file.name.replace(/\.(jpg|jpeg)$/i, '.png'),
        error: '',
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  return (
    <Panel
      title="JPG to PNG Converter"
      description="Convert JPG/JPEG images to lossless PNG format. PNG supports transparency, making it ideal for graphics and logos."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select JPG/JPEG file</span>
            <input
              type="file"
              accept="image/jpeg"
              onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer"
            />
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a
                href={state.downloadUrl}
                download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 3. PNG to WebP ───────────────────────────────────────────────────────────

export function PngToWebp() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [quality, setQuality] = useState(85);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      const url = canvas.toDataURL(getMimeType('webp'), clampQuality(quality));
      setState({
        preview: url, downloadUrl: url,
        fileName: file.name.replace(/\.png$/i, '.webp'), error: '',
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  return (
    <Panel
      title="PNG to WebP Converter"
      description="Convert PNG images to the modern WebP format for significantly smaller file sizes with the same visual quality."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select PNG file</span>
            <input type="file" accept="image/png" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quality: {quality}%</span>
            <input type="range" min={1} max={100} value={quality}
              onChange={e => setQuality(Number(e.target.value))} className="accent-gray-900" />
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 4. WebP to PNG ───────────────────────────────────────────────────────────

export function WebpToPng() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      const url = canvas.toDataURL(getMimeType('png'));
      setState({
        preview: url, downloadUrl: url,
        fileName: file.name.replace(/\.webp$/i, '.png'), error: '',
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  return (
    <Panel
      title="WebP to PNG Converter"
      description="Convert WebP images to lossless PNG format for maximum compatibility with older applications and browsers."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select WebP file</span>
            <input type="file" accept="image/webp" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 5. JPG to WebP ───────────────────────────────────────────────────────────

export function JpgToWebp() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [quality, setQuality] = useState(85);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      const url = canvas.toDataURL(getMimeType('webp'), clampQuality(quality));
      setState({
        preview: url, downloadUrl: url,
        fileName: file.name.replace(/\.(jpg|jpeg)$/i, '.webp'), error: '',
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  return (
    <Panel
      title="JPG to WebP Converter"
      description="Convert JPG/JPEG images to WebP format for smaller files with equal or better visual quality."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select JPG/JPEG file</span>
            <input type="file" accept="image/jpeg" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quality: {quality}%</span>
            <input type="range" min={1} max={100} value={quality}
              onChange={e => setQuality(Number(e.target.value))} className="accent-gray-900" />
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 6. SVG to PNG ────────────────────────────────────────────────────────────

export function SvgToPng() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });

    const svgBlob = new Blob([file], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL(getMimeType('png'));
      setState({
        preview: pngUrl, downloadUrl: pngUrl,
        fileName: file.name.replace(/\.svg$/i, '.png'), error: '',
      });
      URL.revokeObjectURL(svgUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      setState(s => ({ ...s, error: 'Failed to render SVG. Ensure the file is a valid SVG.' }));
    };
    img.src = svgUrl;
  };

  return (
    <Panel
      title="SVG to PNG Converter"
      description="Render SVG vector graphics as PNG raster images in your browser. Set a custom output width and height."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select SVG file</span>
            <input type="file" accept="image/svg+xml,.svg" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          <div className="flex gap-3">
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Width (px)</span>
              <input type="number" min={1} max={4096} value={width}
                onChange={e => setWidth(Number(e.target.value))}
                className="border border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Height (px)</span>
              <input type="number" min={1} max={4096} value={height}
                onChange={e => setHeight(Number(e.target.value))}
                className="border border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm" />
            </label>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 7. HEIC to JPG ───────────────────────────────────────────────────────────

export function HeicToJpg() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(90);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });
    setLoading(true);

    try {
      // Lazy-load heic2any to avoid SSR bundle weight
      // @ts-ignore
      const heic2any = (await import('heic2any')).default;
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: clampQuality(quality) }) as Blob;

      const jpgUrl = URL.createObjectURL(blob);
      // Load into Image to produce a data URL for the download link
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', clampQuality(quality));
        URL.revokeObjectURL(jpgUrl);
        setState({
          preview: dataUrl, downloadUrl: dataUrl,
          fileName: file.name.replace(/\.heic$/i, '.jpg'), error: '',
        });
        setLoading(false);
      };
      img.onerror = () => {
        URL.revokeObjectURL(jpgUrl);
        setState(s => ({ ...s, error: 'Conversion failed.' }));
        setLoading(false);
      };
      img.src = jpgUrl;
    } catch {
      setState(s => ({ ...s, error: 'Failed to convert HEIC. Ensure the file is a valid HEIC image.' }));
      setLoading(false);
    }
  };

  return (
    <Panel
      title="HEIC to JPG Converter"
      description="Convert Apple HEIC/HEIF images (from iPhone) to standard JPG format. Runs entirely in your browser — files are never uploaded."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select HEIC file</span>
            <input type="file" accept=".heic,.heif" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quality: {quality}%</span>
            <input type="range" min={1} max={100} value={quality}
              onChange={e => setQuality(Number(e.target.value))} className="accent-gray-900" />
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {loading && <p className="text-gray-500 text-sm">Converting… this may take a moment.</p>}
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 8. Image to Base64 ───────────────────────────────────────────────────────

export function ImageToBase64() {
  const [dataUri, setDataUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDataUri(''); setError(''); setFileName(file.name);

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setDataUri(result);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsDataURL(file);
  };

  const copy = () => {
    if (!dataUri) return;
    navigator.clipboard.writeText(dataUri).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Panel
      title="Image to Base64 Converter"
      description="Convert any image file to a Base64-encoded data URI. Use it to embed images directly in HTML, CSS, or JSON without a separate file."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select image file</span>
            <input type="file" accept="image/*" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {dataUri && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{fileName}</span>
                <button onClick={copy}
                  className="py-1 px-3 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer">
                  {copied ? 'Copied!' : 'Copy data URI'}
                </button>
              </div>
              <textarea
                readOnly
                value={dataUri}
                rows={6}
                className="w-full bg-white text-gray-900 text-xs font-mono p-2 border border-gray-300 focus:border-gray-900 focus:outline-none resize-none"
              />
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 9. Base64 to Image ───────────────────────────────────────────────────────

export function Base64ToImage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const isValid = validateBase64DataUri(input.trim());

  // Derive download filename from mime type
  const getExt = (uri: string) => {
    const m = uri.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
    if (!m) return 'image';
    return m[1] === 'jpeg' ? 'jpg' : m[1];
  };

  return (
    <Panel
      title="Base64 to Image Converter"
      description="Paste a Base64-encoded image data URI to preview and download the image. Supports PNG, JPG, WebP, GIF, and other formats."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Paste Base64 data URI</span>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              placeholder="data:image/png;base64,iVBORw0KGgo..."
              rows={5}
              className="w-full bg-white text-gray-900 text-xs font-mono p-2 border border-gray-300 focus:border-gray-900 focus:outline-none resize-none"
            />
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {input && !isValid && (
            <p className="text-amber-400 text-sm">Input does not look like a valid image data URI (must start with data:image/...).</p>
          )}
          {isValid && (
            <div className="flex flex-col gap-2">
              <img src={input.trim()} alt="Decoded preview" className="rounded max-h-64 object-contain" />
              <a href={input.trim()} download={`image.${getExt(input.trim())}`}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download Image
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 10. Image Resizer ────────────────────────────────────────────────────────

export function ImageResizer() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [targetW, setTargetW] = useState(800);
  const [targetH, setTargetH] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [originalSize, setOriginalSize] = useState('');
  const [outputSize, setOutputSize] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const convert = () => {
    const img = imgRef.current;
    if (!img) return;
    const { w, h } = getScaledDimensions(
      img.naturalWidth, img.naturalHeight, targetW, targetH, maintainAspect,
    );
    const canvas = canvasRef.current!;
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const url = canvas.toDataURL(getMimeType('png'));
    // Estimate output size from base64 length
    const bytes = Math.round((url.length - 'data:image/png;base64,'.length) * 3 / 4);
    setOutputSize(formatFileSize(bytes));
    setState(s => ({ ...s, preview: url, downloadUrl: url, error: '' }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: file.name.replace(/\.[^.]+$/, '.png'), error: '' });
    setOriginalSize(formatFileSize(file.size));
    setOutputSize('');

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setTargetW(img.naturalWidth);
      setTargetH(img.naturalHeight);
    };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  return (
    <Panel
      title="Image Resizer"
      description="Resize any image to a custom width and height. Optionally maintain the original aspect ratio to avoid distortion."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select image</span>
            <input type="file" accept="image/*" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          {originalSize && <p className="text-sm text-gray-400">Original size: {originalSize}</p>}
          <div className="flex gap-3">
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Width (px)</span>
              <input type="number" min={1} max={8192} value={targetW}
                onChange={e => setTargetW(Number(e.target.value))}
                className="border border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Height (px)</span>
              <input type="number" min={1} max={8192} value={targetH}
                onChange={e => setTargetH(Number(e.target.value))}
                className="border border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={maintainAspect}
              onChange={e => setMaintainAspect(e.target.checked)}
              className="accent-gray-900" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Maintain aspect ratio</span>
          </label>
          <button onClick={convert}
            className="py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
            Resize Image
          </button>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              {outputSize && <p className="text-sm text-gray-400">Output size (approx.): {outputSize}</p>}
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 11. Image Compressor ─────────────────────────────────────────────────────

export function ImageCompressor() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [quality, setQuality] = useState(75);
  const [originalSize, setOriginalSize] = useState('');
  const [outputSize, setOutputSize] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });
    setOriginalSize(formatFileSize(file.size));
    setOutputSize('');

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      // White background for JPEG (no transparency)
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL(getMimeType('jpg'), clampQuality(quality));
      const bytes = Math.round((url.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
      setOutputSize(formatFileSize(bytes));
      setState({
        preview: url, downloadUrl: url,
        fileName: file.name.replace(/\.[^.]+$/, `-compressed.jpg`), error: '',
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  return (
    <Panel
      title="Image Compressor"
      description="Reduce image file size by adjusting JPEG compression quality. Lower quality means smaller files. Output is always JPEG."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select image</span>
            <input type="file" accept="image/*" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quality: {quality}%</span>
            <input type="range" min={1} max={100} value={quality}
              onChange={e => setQuality(Number(e.target.value))} className="accent-gray-900" />
          </label>
          {originalSize && <p className="text-sm text-gray-400">Original: {originalSize}</p>}
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              {outputSize && <p className="text-sm text-gray-400">Compressed (approx.): {outputSize}</p>}
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 12. Image Cropper ────────────────────────────────────────────────────────

export function ImageCropper() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(0);
  const [cropH, setCropH] = useState(0);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: file.name.replace(/\.[^.]+$/, '-cropped.png'), error: '' });

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
      setCropX(0); setCropY(0);
      setCropW(img.naturalWidth); setCropH(img.naturalHeight);
    };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  const applyCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    try {
      const { sx, sy, sw, sh } = getCropParams(imgDims.w, imgDims.h, cropX, cropY, cropW, cropH);
      const canvas = canvasRef.current!;
      canvas.width = sw;
      canvas.height = sh;
      canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const url = canvas.toDataURL(getMimeType('png'));
      setState(s => ({ ...s, preview: url, downloadUrl: url, error: '' }));
    } catch (err) {
      setState(s => ({ ...s, error: String(err) }));
    }
  };

  return (
    <Panel
      title="Image Cropper"
      description="Crop an image by specifying the top-left corner (x, y) and the width and height of the region to keep."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select image</span>
            <input type="file" accept="image/*" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          {imgDims.w > 0 && (
            <>
              <p className="text-sm text-gray-400">Image: {imgDims.w} x {imgDims.h} px</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'X (left offset px)', val: cropX, set: setCropX },
                  { label: 'Y (top offset px)', val: cropY, set: setCropY },
                  { label: 'Width (px)', val: cropW, set: setCropW },
                  { label: 'Height (px)', val: cropH, set: setCropH },
                ].map(({ label, val, set }) => (
                  <label key={label} className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">{label}</span>
                    <input type="number" min={0} value={val}
                      onChange={e => set(Number(e.target.value))}
                      className="border border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm" />
                  </label>
                ))}
              </div>
              <button onClick={applyCrop}
                className="py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Crop Image
              </button>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 13. Image Rotator / Flipper ──────────────────────────────────────────────

type RotateDirection = 'cw90' | 'ccw90' | '180' | 'flipH' | 'flipV';

const ROTATE_OPTIONS: { label: string; value: RotateDirection }[] = [
  { label: 'Rotate 90° CW', value: 'cw90' },
  { label: 'Rotate 90° CCW', value: 'ccw90' },
  { label: 'Rotate 180°', value: '180' },
  { label: 'Flip Horizontal', value: 'flipH' },
  { label: 'Flip Vertical', value: 'flipV' },
];

export function ImageRotator() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [direction, setDirection] = useState<RotateDirection>('cw90');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: file.name.replace(/\.[^.]+$/, '-rotated.png'), error: '' });
    const img = new Image();
    img.onload = () => { imgRef.current = img; };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  const applyTransform = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const { naturalWidth: W, naturalHeight: H } = img;
    const deg = getRotationDegrees(direction);
    const isFlip = direction === 'flipH' || direction === 'flipV';
    const swapDims = deg === 90 || deg === -90;

    canvas.width = swapDims ? H : W;
    canvas.height = swapDims ? W : H;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    if (!isFlip) {
      ctx.rotate((deg * Math.PI) / 180);
    } else if (direction === 'flipH') {
      ctx.scale(-1, 1);
    } else {
      ctx.scale(1, -1);
    }

    ctx.drawImage(img, -W / 2, -H / 2, W, H);
    ctx.restore();

    const url = canvas.toDataURL(getMimeType('png'));
    setState(s => ({ ...s, preview: url, downloadUrl: url, error: '' }));
  };

  return (
    <Panel
      title="Image Rotator & Flipper"
      description="Rotate an image 90°, 180°, or flip it horizontally or vertically. Output is PNG."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select image</span>
            <input type="file" accept="image/*" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Transform</span>
            <select value={direction} onChange={e => setDirection(e.target.value as RotateDirection)}
              className="bg-white text-gray-900 px-2 py-1.5 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none">
              {ROTATE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <button onClick={applyTransform}
            className="py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
            Apply Transform
          </button>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <img src={state.preview} alt="Preview" className="rounded max-h-64 object-contain" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download {state.fileName}
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 14. PNG to ICO ───────────────────────────────────────────────────────────

const ICO_SIZES = [16, 32, 48] as const;

export function PngToIco() {
  const [state, setState] = useState<ConvertState>({
    preview: '', downloadUrl: '', fileName: '', error: '',
  });
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ preview: '', downloadUrl: '', fileName: '', error: '' });
    const img = new Image();
    img.onload = () => { imgRef.current = img; };
    img.onerror = () => setState(s => ({ ...s, error: 'Failed to load image.' }));
    img.src = URL.createObjectURL(file);
  };

  const generateIco = async () => {
    const img = imgRef.current;
    if (!img) return;
    setLoading(true);
    setState(s => ({ ...s, error: '' }));

    try {
      // Render each size to a canvas and extract PNG Uint8Array
      const canvas = canvasRef.current!;
      const blocks: { size: number; data: Uint8Array }[] = [];

      for (const size of ICO_SIZES) {
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        // Convert canvas data URL to Uint8Array
        const dataUrl = canvas.toDataURL(getMimeType('png'));
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        blocks.push({ size, data: bytes });
      }

      const icoBytes = buildIcoFile(blocks);
      const blob = new Blob([icoBytes], { type: 'image/x-icon' });
      const url = URL.createObjectURL(blob);

      // Use 48x48 PNG as preview
      const previewDataUrl = canvas.toDataURL(getMimeType('png')); // last rendered size is 48
      setState({
        preview: previewDataUrl,
        downloadUrl: url,
        fileName: 'favicon.ico',
        error: '',
      });
    } catch (err) {
      setState(s => ({ ...s, error: String(err) }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel
      title="PNG to ICO Converter"
      description="Convert a PNG image to a multi-size ICO file containing 16x16, 32x32, and 48x48 icons. Ideal for favicons."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select PNG file</span>
            <input type="file" accept="image/png" onChange={handleFile}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-gray-700 hover:file:border-gray-900 hover:file:text-gray-900 cursor-pointer" />
          </label>
          <p className="text-xs text-gray-500">Generates a multi-size ICO with 16x16, 32x32, and 48x48 variants from your PNG.</p>
          <button onClick={generateIco} disabled={!imgRef.current || loading}
            className="py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Generating...' : 'Generate ICO'}
          </button>
          <canvas ref={canvasRef} className="hidden" />
          {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
          {state.preview && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-400">Preview (48x48):</p>
              <img src={state.preview} alt="Preview" className="w-12 h-12 object-contain rounded" />
              <a href={state.downloadUrl} download={state.fileName}
                className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
                Download favicon.ico
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}
