interface StoredFileResponse {
    success: boolean;
    data: {
        id: string;
        original_filename: string;
        file_path: string;
        file_url: string;
        mime_type: string;
        file_size: number;
        year: number | undefined;
        month: number | undefined;
        day: number | undefined;
        page: number | undefined;
    };
}

export interface StoredFile {
    id: string;
    name: string;
    path: string;
    url: string;
    type: string;
    size: number;
    year: number;
    month: number;
    day: number;
    page?: number;
    uploadedAt: string;
}

export const storeFile = async (file: File, csrfToken: string): Promise<StoredFile> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('_token', csrfToken);

        const response = await fetch('/publications/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': csrfToken
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload file');
        }

        const data = await response.json() as StoredFileResponse;
        
        return {
            id: data.data.id,
            name: data.data.original_filename,
            path: data.data.file_path,
            url: data.data.file_url,
            type: data.data.mime_type,
            size: data.data.file_size,
            year: data.data.year ?? new Date().getFullYear(),
            month: data.data.month ?? new Date().getMonth() + 1,
            day: data.data.day ?? new Date().getDate(),
            page: data.data.page,
            uploadedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}
