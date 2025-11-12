import React, { forwardRef, InputHTMLAttributes } from 'react';

interface FolderInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    onChange: (files: FileList | File[]) => void;
    webkitdirectory?: string;
    directory?: string;
}

const FolderInput = forwardRef<HTMLInputElement, FolderInputProps>(({ onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onChange(e.target.files);
        }
    };

    return (
        <input
            type="file"
            ref={ref}
            onChange={handleChange}
            {...props}
        />
    );
});

FolderInput.displayName = 'FolderInput';

export default FolderInput;
