import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, X, FolderOpen } from 'lucide-react';
import { useCallback, useState, useRef, ChangeEvent, DragEvent } from 'react';
import { toast } from 'sonner';
import { parsePdfFilename } from '@/utils/pdf-parser';
import { storeFile } from '@/utils/storage';

interface FileWithPreview extends File {
    preview: string;
    status?: 'pending' | 'uploading' | 'success' | 'error' | 'skipped';
    progress?: number;
    error?: string;
    retryCount?: number;
    parsedInfo?: {
        title?: string;
        year?: number;
        month?: number;
        day?: number;
        page?: number;
    };
}

export default function CreatePublication() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [currentUploadIndex, setCurrentUploadIndex] = useState(0);

    const { data, setData, processing, errors, reset } = useForm({
        title: '',
        description: '',
        publication_date: new Date().toISOString().split('T')[0],
        type: 'Main publication' as const,
        is_valid: true,
        is_disabled: false
    });

    // Process files from folder upload
    const processFolderUpload = (fileList: FileList): File[] => {
        const files: File[] = [];
        
        // Convert FileList to array and filter for PDFs
        const fileArray = Array.from(fileList).filter(file => 
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );
        
        // If no files have webkitRelativePath, it's a regular file selection
        const isFolderUpload = fileArray.some(file => (file as any).webkitRelativePath);
        
        if (isFolderUpload) {
            // For folder upload, store the relative path in a custom property but use only the filename as the name
            fileArray.forEach(file => {
                const relativePath = (file as any).webkitRelativePath;
                if (relativePath) {
                    // Create a new File object with just the filename, not the full path
                    const fileName = relativePath.split('/').pop() || file.name;
                    const newFile = new File(
                        [file], 
                        fileName,  // Only use the filename, not the full path
                        { type: file.type || 'application/pdf' }
                    );
                    // Store the original path in a custom property if needed
                    (newFile as any).originalPath = relativePath;
                    files.push(newFile);
                } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    files.push(file);
                }
            });
        } else {
            // For regular file selection, just add PDFs
            files.push(...fileArray);
        }
        
        return files;
    };

    const handleFileChange = useCallback((selectedFiles: FileList | File[]) => {
        // If it's a FileList from input, process it
        if (selectedFiles instanceof FileList) {
            const files = processFolderUpload(selectedFiles);
            if (files.length === 0) {
                toast.error('No PDF files found in the selected folder');
                return;
            }
            processFiles(files);
        } else {
            // It's already an array of Files
            const pdfFiles = selectedFiles.filter(file => 
                file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            );
            if (pdfFiles.length === 0) {
                toast.error('Please select PDF files only');
                return;
            }
            processFiles(pdfFiles);
        }
    }, []);
    
    const processFiles = useCallback((files: File[]) => {
        const validFiles: FileWithPreview[] = [];
        const invalidFiles: {name: string, reason: string}[] = [];
        
        files.forEach(file => {
            // Validate file type (check extension as well for better reliability)
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            if (!isPdf) {
                invalidFiles.push({ name: file.name, reason: 'Not a PDF file' });
                return;
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                invalidFiles.push({ name: file.name, reason: 'File size exceeds 10MB' });
                return;
            }

            const fileWithPreview = Object.assign(file, {
                preview: URL.createObjectURL(file),
                status: 'pending' as const,
                progress: 0,
                parsedInfo: parsePdfFilename(file.name)
            });

            validFiles.push(fileWithPreview as FileWithPreview);
        });

        if (invalidFiles.length > 0) {
            let errorMessage = `Could not add ${invalidFiles.length} file(s):\n` +
                invalidFiles.slice(0, 5).map(f => `• ${f.name}: ${f.reason}`).join('\n');
            if (invalidFiles.length > 5) {
                errorMessage += `\n...and ${invalidFiles.length - 5} more`;
            }
            toast.error(errorMessage, { duration: 10000 });
        }

        if (validFiles.length > 0) {
            setFiles(prevFiles => [...prevFiles, ...validFiles]);
        }
    }, [setFiles]);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileChange(e.dataTransfer.files);
        }
    }, [handleFileChange]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileChange(e.target.files);
        }
    };

    const handleRemoveFile = useCallback((index: number) => {
        setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            const removedFile = newFiles.splice(index, 1)[0];
            if (removedFile?.preview) {
                URL.revokeObjectURL(removedFile.preview);
            }
            return newFiles;
        });
    }, []);

    const handleRemoveAllFiles = useCallback(() => {
        files.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [files]);

    const { csrfToken } = usePage().props;

    // Helper function to update file status
    const updateFileStatus = useCallback((fileIndex: number, status: FileWithPreview['status'], progress?: number, error?: string) => {
        setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            if (newFiles[fileIndex]) {
                newFiles[fileIndex] = { 
                    ...newFiles[fileIndex], 
                    status, 
                    progress: progress ?? newFiles[fileIndex].progress,
                    error: error ?? newFiles[fileIndex].error 
                };
            }
            return newFiles;
        });
    }, []);

    // Function to check if file already exists
    const checkFileExists = async (filename: string): Promise<boolean> => {
        try {
            // Encode the filename to handle special characters
            const encodedFilename = encodeURIComponent(filename);
            const url = route('publications.check', { filename: encodedFilename });
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken as string,
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
            });
            
            // Get response text first to avoid "body stream already read" error
            const responseText = await response.text();
            
            // Handle non-OK responses
            if (!response.ok) {
                let errorMessage = `File check failed with status: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If we can't parse JSON, use the text response
                    if (responseText) {
                        errorMessage = `Server responded with: ${responseText.substring(0, 200)}`;
                    }
                }
                console.error('File check failed:', errorMessage);
                throw new Error(errorMessage);
            }
            
            // Try to parse JSON response
            try {
                const data = JSON.parse(responseText);
                return data.exists || false;
            } catch (e) {
                console.error('Invalid JSON response:', e);
                throw new Error('Invalid response from server');
            }
            
        } catch (error) {
            console.error('Error checking file existence:', error);
            // Don't throw the error, just log it and return false to continue with upload
            // This prevents the entire upload process from failing due to a file check issue
            toast.warning(`Could not verify if ${filename} already exists. Proceeding with upload.`);
            return false;
        }
    };

    const uploadNextFile = useCallback(async (index: number) => {
        if (index >= files.length) {
            setIsUploading(false);
            const successCount = files.filter(f => f.status === 'success').length;
            const skippedCount = files.filter(f => f.status === 'skipped').length;
            
            let message = `Successfully uploaded ${successCount} file(s) for verification`;
            if (skippedCount > 0) {
                message += `, skipped ${skippedCount} duplicate(s)`;
            }
            message += '. Your files are now pending admin/librarian approval.';
            
            toast.success(message, { duration: 5000 });
            
            // Redirect to publications list after successful upload
            window.setTimeout(() => {
                window.location.href = route('publications');
            }, 2500);
            return;
        }

        setCurrentUploadIndex(index);
        const currentFile = files[index];
        
        // Update file status to uploading
        updateFileStatus(index, 'uploading', 0);

        try {
            // Check if file already exists
            const fileExists = await checkFileExists(currentFile.name);
            if (fileExists) {
                updateFileStatus(index, 'skipped', 0, 'File already exists');
                // Skip to next file
                uploadNextFile(index + 1);
                return;
            }

            // Create FormData with file and publication data
            const formData = new FormData();
            formData.append('file', currentFile);
            formData.append('_method', 'POST');
            formData.append('title', data.title || currentFile.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
            formData.append('description', data.description || '');
            formData.append('publication_date', data.publication_date || new Date().toISOString().split('T')[0]);
            formData.append('type', data.type || 'Periodical');
            formData.append('is_valid', String(data.is_valid || true));
            formData.append('is_disabled', String(data.is_disabled || false));
            // Extract just the name part (before the first hyphen followed by a number)
            const filename = currentFile.name.replace(/\.pdf$/i, '');
            // Split at the first hyphen followed by a number (year)
            const nameParts = filename.split(/(-\d{4}|-\d{2})/);
            // Take only the first part and clean it up
            const justName = nameParts[0].trim().replace(/[-_]/g, ' ');
            
            // Store only the name part in the database
            formData.append('name', data.title || justName);
            
            // Keep the rest of the code for other fields
            if (currentFile.parsedInfo) {
                const { year, month, day, page } = currentFile.parsedInfo;
                if (year) formData.append('year', String(year));
                if (month) formData.append('month', String(month));
                if (day) formData.append('day', String(day));
                if (page) formData.append('page', String(page));
            }

            // Add parsed file info if available
            if (currentFile.parsedInfo) {
                const { year, month, day, page } = currentFile.parsedInfo;
                if (year) formData.append('year', String(year));
                if (month) formData.append('month', String(month));
                if (day) formData.append('day', String(day));
                if (page) formData.append('page', String(page));
            }

            // Make a single request to store the file and create the publication
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            
            const response = await fetch(route('publications.store'), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken as string,
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);

            // Get the response as text first to handle potential non-JSON responses
            const responseText = await response.text();
            let responseData;
            
            try {
                // Try to parse as JSON
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                // If parsing fails, it's not a JSON response
                console.error('Failed to parse response as JSON:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: responseText.substring(0, 500) // Log first 500 chars to avoid huge logs
                });
                
                // Try to extract error message from HTML if it's an HTML error page
                let errorMessage = `Server returned ${response.status} ${response.statusText}`;
                const errorMatch = responseText.match(/<title>(.*?)<\/title>/i);
                if (errorMatch && errorMatch[1]) {
                    errorMessage = errorMatch[1];
                }
                
                throw new Error(`Server error: ${errorMessage}`);
            }
            
            if (!response.ok) {
                console.error('Upload failed with response:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: responseData
                });
                
                const errorMessage = responseData?.message || 
                                   responseData?.error?.message || 
                                   responseData?.error ||
                                   'Failed to upload file';
                
                throw new Error(errorMessage);
            }
            
            // Verify the response contains the expected data structure
            if (!responseData || typeof responseData !== 'object') {
                console.error('Invalid response format:', responseData);
                throw new Error('Invalid response format from server');
            }

            // Update file status to success
            updateFileStatus(index, 'success', 100);

            // Process next file
            uploadNextFile(index + 1);
        } catch (error: any) {
            console.error('Upload error:', error);
            
            // Extract a more user-friendly error message
            let errorMessage = 'Upload failed';
            let showErrorDetails = false;
            
            if (error instanceof Error) {
                errorMessage = error.message;
                
                // Handle common error cases
                if (error.name === 'AbortError') {
                    errorMessage = 'Upload timed out. Please try again with a smaller file or check your connection.';
                } else if (error.message.includes('This file has already been uploaded')) {
                    errorMessage = 'File already exists. This PDF has been uploaded previously.';
                    updateFileStatus(index, 'skipped', 100, errorMessage);
                    uploadNextFile(index + 1); // Skip to next file instead of retrying
                    return;
                } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                } else if (error.message.includes('Server returned 5')) {
                    errorMessage = 'Server error. Please try again later or contact support.';
                    showErrorDetails = true;
                } else if (error.message.includes('Server returned 4')) {
                    errorMessage = 'Request error. Please check your input and try again.';
                    showErrorDetails = true;
                } else if (error.message.includes('Invalid server response') || 
                          error.message.includes('Invalid response format')) {
                    errorMessage = 'The server returned an unexpected response. Please try again.';
                    showErrorDetails = true;
                }
                
                // Log detailed error for debugging
                console.error('Upload error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    file: currentFile?.name,
                    timestamp: new Date().toISOString()
                });
            }
            
            updateFileStatus(index, 'error', 0, errorMessage);
            
            // Log detailed error for debugging
            console.error('Upload failed for file:', currentFile.name);
            console.error('Error details:', {
                name: error?.name,
                message: error?.message,
                stack: error?.stack
            });
            
            // Check if we should retry
            const currentRetryCount = currentFile.retryCount || 0;
            const maxRetries = 2;
            
            if (currentRetryCount < maxRetries && 
                (error.name === 'AbortError' || error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
                
                // Update retry count
                setFiles(prevFiles => {
                    const newFiles = [...prevFiles];
                    newFiles[index] = { 
                        ...newFiles[index], 
                        retryCount: currentRetryCount + 1,
                        status: 'pending'
                    };
                    return newFiles;
                });
                
                toast.warning(`Retrying upload for ${currentFile.name} (${currentRetryCount + 1}/${maxRetries})`);
                
                // Retry after a short delay
                setTimeout(() => {
                    uploadNextFile(index);
                }, 2000);
                return;
            }
            
            // Show error toast with more context
            toast.error(`Failed to upload ${currentFile.name}`, {
                description: errorMessage,
                action: showErrorDetails ? {
                    label: 'Details',
                    onClick: () => {
                        const details = `File: ${currentFile.name}\n` +
                                     `Error: ${errorMessage}\n` +
                                     `Status: ${error?.status || 'N/A'}\n` +
                                     `Code: ${error?.code || 'N/A'}`;
                        
                        // Show in a dialog or alert for now
                        alert(details);
                    }
                } : undefined
            });
            
            // Add a small delay before continuing with the next file
            // to allow the user to see the error message
            setTimeout(() => {
                uploadNextFile(index + 1);
            }, 1000);
        }
    }, [files, csrfToken, data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (files.length === 0) {
            toast.error('Please select at least one file to upload');
            return;
        }

        setIsUploading(true);
        uploadNextFile(0);
    };

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Publications', href: '/publications' },
                { title: 'Add Publication', href: '/publications/create' },
            ]}
        >
            <Head title="Add Publication" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Add New Publication</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Upload a new publication to the library
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={route('publications')} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Publications
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div 
                        className={`flex-1 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                            isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'
                        } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleFileChange(e.dataTransfer.files);
                            }
                        }}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleInputChange}
                            className="hidden"
                            accept=".pdf"
                            multiple
                            disabled={isUploading}
                            // @ts-ignore - webkitdirectory is not in the type definition
                            webkitdirectory=""
                        />

                        {files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="rounded-full bg-primary/10 p-4">
                                    <Upload className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-lg font-medium">
                                        {isDragging ? 'Drop the files here' : 'Upload publications'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Drag and drop your PDF files here, or click to browse
                                    </p>
                                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                                        📋 Files will be uploaded for admin/librarian verification before being published
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="mt-2" 
                                        disabled={isUploading}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (fileInputRef.current) {
                                                fileInputRef.current.removeAttribute('webkitdirectory');
                                                fileInputRef.current.removeAttribute('directory');
                                                // Clear the input value to allow selecting the same file again
                                                fileInputRef.current.value = '';
                                                fileInputRef.current.click();
                                            }
                                        }}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Select Files
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="mt-2" 
                                        disabled={isUploading}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (fileInputRef.current) {
                                                fileInputRef.current.setAttribute('webkitdirectory', '');
                                                fileInputRef.current.setAttribute('directory', '');
                                                // Clear the input value to allow selecting the same folder again
                                                fileInputRef.current.value = '';
                                                fileInputRef.current.click();
                                            }
                                        }}
                                    >
                                        <FolderOpen className="h-4 w-4 mr-2" />
                                        Upload Folder
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    PDF files up to 10MB each
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium">
                                            {files.length} file{files.length !== 1 ? 's' : ''} selected
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {files.filter(f => f.status === 'success').length} uploaded • {files.filter(f => f.status === 'error').length} failed
                                        </p>
                                    </div>
                                    {!isUploading && (
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveAllFiles();
                                            }}
                                        >
                                            Clear all
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="relative rounded-lg border p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col gap-1">
                                                            <p className="truncate font-medium text-sm">
                                                                {file.name}
                                                            </p>
                                                            {file.parsedInfo && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    <p>Year: {file.parsedInfo.year} | Month: {file.parsedInfo.month} | Date: {file.parsedInfo.day} | Page: {file.parsedInfo.page}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                    </div>
                                                    
                                                    {file.status === 'uploading' && (
                                                        <div className="mt-2">
                                                            <div className="flex items-center justify-between text-xs mb-1">
                                                                <span>Uploading...</span>
                                                                <span>{file.progress}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                                                <div 
                                                                    className="h-full bg-primary transition-all duration-300 ease-in-out" 
                                                                    style={{ width: `${file.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {file.status === 'success' && (
                                                        <p className="text-xs text-green-600 mt-1">
                                                            Uploaded successfully
                                                        </p>
                                                    )}
                                                    
                                                    {file.status === 'error' && file.error && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {file.error}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {!isUploading && (
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFile(index);
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {files.length > 0 && (
                                <span>
                                    {files.length} file{files.length !== 1 ? 's' : ''} selected • 
                                    {`${(files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2)} MB`}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                asChild
                                disabled={isUploading}
                            >
                                <Link href={route('publications')}>Cancel</Link>
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={files.length === 0 || isUploading}
                                className="gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Uploading {currentUploadIndex + 1} of {files.length}...
                                    </>
                                ) : (
                                    `Submit ${files.length} File${files.length !== 1 ? 's' : ''} for Verification`
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
