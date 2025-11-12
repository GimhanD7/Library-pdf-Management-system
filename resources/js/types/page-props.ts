export interface FlashMessage {
    message?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
}

export interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

export interface SharedData {
    sidebarOpen: boolean;
    flash?: FlashMessages;
}

import { PageProps as InertiaPageProps } from '@inertiajs/core';

export interface PageProps extends InertiaPageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            email_verified_at: string | null;
            created_at: string;
            updated_at: string;
        };
    };
    flash?: FlashMessage;
    publications?: Array<{
        date: string;
        month: string;
        year: string;
        files: string[];
    }>;
}
