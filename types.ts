import { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";



export type BasicCoversionType = {
    title: string;
    swapLink?: string;
    description: string;
    fromValue: string;
    toValue: string;
    setFromValue: Dispatch<SetStateAction<string>>;
    fromTitle: string;
    toTitle: string;
    // Set by tools whose input pane only mirrors values gathered elsewhere on
    // the page: it then takes neither typing nor a dropped file.
    inputReadOnly?: boolean;
    pageTitle?: string;
    backColor: MainViewColorVariants;
}


export type BasicPlaceholderType = {
    title: string;
    description: string;
    fromTitle: string;
    toTitle: string;
    pageTitle?: string;
    backColor: MainViewColorVariants;
}

export type AdvancedCoversionType = {
    title: string;
    swapLink?: string;
    description: string;
    fromValue: string;
    toValue: string;
    setFromValue: Dispatch<SetStateAction<string>>;
    extraElements: React.JSX.Element;
    fromTitle: string;
    toTitle: string;
    // Rendered under the output textarea, for tools with a second, non-textual
    // view of the result (a diagram, a grid) that must not pollute the output.
    belowOutput?: React.ReactNode;
    // As above: an input pane that only mirrors values gathered elsewhere.
    inputReadOnly?: boolean;
    pageTitle?: string;
    backColor: MainViewColorVariants;
}

export type PanelType = {
    title: string;
    swapLink?: string;
    description: string;
    extraElements: React.JSX.Element;
    pageTitle?: string;
    backColor: MainViewColorVariants;
}

export type MediaMedium = 'image' | 'audio' | 'video' | 'pdf' | 'file';

export type MediaSource = {
    url: string;
    name: string;
    meta?: string;
    /**
     * Replaces the medium's default preview — a rendered PDF page instead of a
     * file name, for instance. The tool owns whatever it renders here.
     */
    preview?: React.ReactNode;
};

export type MediaResult = {
    url: string;
    fileName: string;
    meta?: string;
    /** Replaces the medium's default preview, as on `MediaSource`. */
    preview?: React.ReactNode;
};

export type MediaConverterType = {
    title: string;
    description: string;
    backColor: MainViewColorVariants;
    /** `accept` attribute for the hidden file input, e.g. 'audio/*' */
    accept: string;
    multiple?: boolean;
    inputMedium: MediaMedium;
    outputMedium: MediaMedium | 'text';
    /** Overrides the default "Drop a file or click to browse" prompt. */
    hint?: string;
    onFiles: (files: File[]) => void;
    onClear?: () => void;
    source?: MediaSource;
    result?: MediaResult;
    /**
     * Multi-file output. Takes precedence over `result` and renders as a row
     * list with a per-file save link; `meta` becomes that link's label.
     */
    results?: MediaResult[];
    /** Primary action for `results` — usually saves every file in sequence. */
    onDownloadAll?: () => void;
    /** Used when outputMedium is 'text'. */
    textResult?: string;
    textResultTitle?: string;
    /**
     * A rendered view of the result — a report card grid, a waveform — shown
     * above the output surface. Report tools lead with this and keep the plain
     * text underneath for copying.
     */
    outputVisual?: React.ReactNode;
    progress?: { pct: number; label: string };
    error?: string;
    /** Options for the transform, rendered under the input pane. */
    extraElements?: React.JSX.Element;
    pageTitle?: string;
};

export type TextAnalyticsType = {
    userInput: string;
    title: string;
    output: boolean;
    color: MainViewColorVariants;
    // Input rows only: given a handler, the row offers to fill the textarea
    // from a text file, next to the copy and save buttons that empty it.
    onLoadFile?: (text: string) => void;
}

export type SelectElementsPasswordPropsType = {
    passwd: string;
    setPasswd: React.Dispatch<React.SetStateAction<string>>;
};

export type SwapButtonType = {
    link: string;
    color: MainViewColorVariants;
}

export type InputColorProps = {
    color: string;
    colorInputHandler: (event: ChangeEvent<HTMLInputElement>) => void;
    threeToSixHex: (color: string) => string;
    setFromValue: (value: string) => void;
    fromValue: string;
};

export type OutputColorProps = {
    toValue: { r: number; g: number; b: number; };
}

export type RGBInputColors = {
    onColorChange: (event: { target: { getAttribute: (arg0: string) => any; value: any; }; }) => void;
    fromValue: { r: number; g: number; b: number; };
}

export type RGBColorInput = { 
    r: number; 
    g: number; 
    b: number; 
};


export type MenuLinkType = { name: string, link: string, type: string, tag: string };

export type MenuGroupType = {
    name: string,
    links: Array<MenuLinkType>,
    color: MenuColorVariantKeys,
    titleColor: MenuColorVariantKeys,
    typeColor: MenuColorVariantKeys
}

export type ModalPropsType = {
    closeWindow: () => void;
    children: React.ReactNode;
};

export type ModalOverlayProps = {
    children: React.ReactNode;
};


// Color palletes

export type MenuColorVariantKeys =
  | 'yellow' | 'yellowTitle' | 'yellowType'
  | 'teal' | 'tealTitle' | 'tealType'
  | 'cyan' | 'cyanTitle' | 'cyanType'
  | 'lime' | 'limeTitle' | 'limeType'
  | 'fuchsia' | 'fuchsiaTitle' | 'fuchsiaType'
  | 'rose' | 'roseTitle' | 'roseType'
  | 'sky' | 'skyTitle' | 'skyType'
  | 'violet' | 'violetTitle' | 'violetType'
  | 'red' | 'redTitle' | 'redType';

export type MainViewColorVariants = 'yellow' | 'teal' | 'cyan' | 'lime' | 'fuchsia' | 'rose' | 'sky' | 'violet' | 'red';

export const colorVariants: Record<MainViewColorVariants, string> = {
    yellow: 'border border-amber-200 bg-amber-50',
    teal: 'border border-teal-200 bg-teal-50',
    cyan: 'border border-indigo-200 bg-indigo-50',
    lime: 'border border-emerald-200 bg-emerald-50',
    fuchsia: 'border border-fuchsia-200 bg-fuchsia-50',
    rose: 'border border-rose-200 bg-rose-50',
    sky: 'border border-sky-200 bg-sky-50',
    violet: 'border border-violet-200 bg-violet-50',
    red: 'border border-red-200 bg-red-50',
}

export const colorBadge: Record<MainViewColorVariants, string> = {
    yellow: 'bg-amber-100 text-amber-700 border border-amber-200',
    teal: 'bg-teal-100 text-teal-700 border border-teal-200',
    cyan: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    lime: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200',
    rose: 'bg-rose-100 text-rose-700 border border-rose-200',
    sky: 'bg-sky-100 text-sky-700 border border-sky-200',
    violet: 'bg-violet-100 text-violet-700 border border-violet-200',
    red: 'bg-red-100 text-red-700 border border-red-200',
}

export const colorName: Record<MainViewColorVariants, string> = {
    yellow: 'Encoding',
    teal: 'Hashing',
    cyan: 'Converting',
    lime: 'Tools',
    fuchsia: 'Image',
    rose: 'Text',
    sky: 'Network',
    violet: 'Audio',
    red: 'PDF',
}

