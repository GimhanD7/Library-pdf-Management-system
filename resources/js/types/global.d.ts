import type { route as routeFn } from 'ziggy-js';

// Extend the HTMLInputElement interface to include webkitdirectory and directory attributes
interface HTMLInputElement {
    webkitdirectory: boolean;
    directory: boolean;
}

declare global {
    const route: typeof routeFn;
    
    // Extend the React input attributes to include webkitdirectory and directory
    interface InputHTMLAttributes<T> extends React.InputHTMLAttributes<T> {
        webkitdirectory?: string;
        directory?: string;
    }
}
