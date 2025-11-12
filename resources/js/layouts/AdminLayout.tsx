import React, { ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import { Toaster } from '@/Components/ui/sonner';
import AdminSidebar from '@/Components/AdminSidebar';

interface Props {
    children: ReactNode;
    header?: ReactNode;
}

export default function AdminLayout({ children, header }: Props) {
    return (
        <div className="min-h-screen bg-background">
            <Head>
                <title>Admin - Library Management System</title>
                <meta name="description" content="Library Management System Admin Panel" />
            </Head>

            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <AdminSidebar />

                <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                    {/* Main content */}
                    <main className="flex-1">
                        {header && (
                            <header className="bg-background shadow">
                                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                                    {header}
                                </div>
                            </header>
                        )}
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            <Toaster position="top-right" />
        </div>
    );
}
