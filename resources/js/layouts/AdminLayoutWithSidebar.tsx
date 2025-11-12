import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { AdminSidebar } from '@/components/admin-sidebar';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types/page-props';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AdminLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
}

export default function AdminLayoutWithSidebar({ children, breadcrumbs = [] }: PropsWithChildren<AdminLayoutProps>) {
    const { flash } = usePage<PageProps & { flash?: { success?: string; error?: string } }>().props;

    return (
        <AppShell variant="sidebar">
            <AdminSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                
                {/* Flash Messages */}
                <div className="px-6 pb-6 space-y-4">
                    {flash?.success && (
                        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>{flash.success}</AlertDescription>
                        </Alert>
                    )}
                    {flash?.error && (
                        <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{flash.error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
