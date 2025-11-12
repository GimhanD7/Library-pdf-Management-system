import { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Plus, FileText, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Publication {
    id: number;
    title: string;
    description?: string;
    file_url: string;
    file_size: number;
    year: number;
    month?: number;
    day?: number;
    page?: number;
    created_at: string;
    updated_at: string;
    user_id: number;
}

type PageProps = {
    publications: {
        data: Publication[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
    };
} & Record<string, any>;

function PublicationsContent() {
    const { publications = { data: [] }, filters = {} } = usePage<PageProps>().props;
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isSearching, setIsSearching] = useState(false);

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        router.get('/publications', { search: searchQuery }, {
            preserveState: true,
            onFinish: () => setIsSearching(false),
        });
    };

    // Debounced search
    const debouncedSearch = useMemo(
        () => {
            let timeout: NodeJS.Timeout;
            return (value: string) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (value.trim()) {
                        setIsSearching(true);
                        router.get('/publications', { search: value }, {
                            preserveState: true,
                            onFinish: () => setIsSearching(false),
                        });
                    } else {
                        router.get('/publications', {}, { preserveState: true });
                    }
                }, 500);
            };
        },
        []
    );

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        // The debounced search will handle the actual API call
        debouncedSearch(value);
    };

    // Handle delete publication
    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this publication?')) return;
        
        try {
            const response = await fetch(`/api/publications/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                router.get('/publications', {}, { preserveState: true });
                toast.success('Publication deleted successfully');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete publication');
            }
        } catch (error: any) {
            console.error('Error deleting publication:', error);
            toast.error(error.message || 'Failed to delete publication');
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Publications', href: '/publications' },
            ]}
        >
            <Head title="Publications" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Publications</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and manage your publications
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('publications.create')} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Publication
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search publications..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                    </div>
                </div>

                {/* Publications list */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {isSearching ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="overflow-hidden">
                                    <CardHeader className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-5 rounded-md" />
                                            <Skeleton className="h-6 w-48" />
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (!publications?.data?.length) ? (
                        <div className="flex flex-col items-center space-y-4">
                            <FileText className="h-12 w-12 text-gray-300" />
                            <p className="text-gray-500">No publications found</p>
                            {searchQuery && (
                                <Button variant="outline" onClick={() => {
                                    setSearchQuery('');
                                    router.get('/publications');
                                }}>
                                    <X className="mr-2 h-4 w-4" />
                                    Clear search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {publications.data.map((pub) => (
                                <Card key={pub.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardHeader className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 bg-primary/10 p-2 rounded-md">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium text-base">
                                                            {pub.title}
                                                        </h3>
                                                        {pub.year && (
                                                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                                                {pub.year}
                                                                {pub.month ? `-${pub.month.toString().padStart(2, '0')}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {pub.description && (
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                            {pub.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span>{(pub.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                                        <span>•</span>
                                                        <span>{formatDate(pub.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    asChild
                                                >
                                                    <a 
                                                        href={pub.file_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="no-underline"
                                                    >
                                                        View
                                                    </a>
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(pub.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

export default function Publications() {
    return (
        <ErrorBoundary>
            <PublicationsContent />
        </ErrorBoundary>
    );
}
