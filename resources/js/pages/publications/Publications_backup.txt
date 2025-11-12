import { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PageGroup = [page: number, pubs: Publication[]];
type DayGroup = [day: number, pages: PageGroup[]];
type MonthGroup = [month: number, days: DayGroup[]];
type YearGroup = [year: number, months: MonthGroup[]];
type NameGroup = [name: string, years: YearGroup[]];
import PDFViewer from '@/components/pdf-viewer';
import { Search, Loader2, Plus, FileText, Trash2, ChevronDown, ChevronRight, Eye, Download, Printer, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Publication {
    id: string | number;
    name: string;
    title: string;
    code?: string;
    description?: string;
    original_filename: string;
    file_path: string;
    file_url: string;
    mime_type: string;
    file_size: number;
    year: number;
    month?: number;
    day?: number;
    page?: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    type: 'Main publication' | 'Periodical' | 'Magazine' | 'Other' | string;
    is_disabled: boolean;
    is_valid: boolean;
}

function Publications() {
    const page = usePage();
    const { publications: serverData, filters, canUpload, auth } = page.props as unknown as {
        publications: {
            data: Publication[];
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
            links: Array<{ url: string | null; label: string; active: boolean }>;
        };
        filters: {
            search?: string;
        };
        canUpload: boolean;
        auth: {
            user: {
                id: number;
                name: string;
                email: string;
                roles?: Array<{ name: string }>;
                [key: string]: any;
            };
            can?: {
                delete_publications?: boolean;
                edit_publications?: boolean;
                view_publications?: boolean;
                [key: string]: boolean | undefined;
            };
        };
    };

    // Check if user has delete permission
    const canDelete = auth?.can?.delete_publications || false;

    // Debug permission info
    useEffect(() => {
        console.log('=== Delete Permission Debug ===');
        console.log('User:', auth?.user);
        console.log('Permissions (auth.can):', auth?.can);
        console.log('Can Delete:', canDelete);
        console.log('==============================');
    }, [auth, canDelete]);

    const [publications, setPublications] = useState<Publication[]>([]);
    const [filteredPublications, setFilteredPublications] = useState<Publication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    
    interface ViewingPdf {
        url: string;
        name?: string;
        year?: string;
        month?: string;
        day?: string;
        page?: string;
        filename?: string;
    }
    const [viewingPdf, setViewingPdf] = useState<ViewingPdf | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; publication: Publication } | null>(null);
    const [expandedNames, setExpandedNames] = useState<Record<string, boolean>>({});
    const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        links: [] as Array<{ url: string | null; label: string; active: boolean }>
    });

    useEffect(() => {
        console.log('Rendering with publications:', publications);
    }, [publications]);

    // Helper function to get publication name
    const getPubName = (pub: Publication) => {
        if (pub.name && typeof pub.name === 'string' && pub.name.trim()) {
            return pub.name.trim().toUpperCase();
        }
        const base = (pub.original_filename || '').split('/').pop() || '';
        const prefix = base.split('-')[0] || '';
        return prefix.toUpperCase() || 'UNKNOWN';
    };

    // Helper function to get page from filename
    const getPageFromFilename = (pub: Publication) => {
        const base = (pub.original_filename || '').split('/').pop() || '';
        const parts = base.split('-');
        const last = parts[3] || '';
        const raw = last.replace(/\.[^.]+$/, '');
        const digits = raw.replace(/\D/g, '');
        const n = parseInt(digits || '', 10);
        return Number.isFinite(n) ? n : 0;
    };

    // Format date components for search
    const formatDateComponent = (value?: number) => {
        if (!value) return '';
        return value < 10 ? `0${value}` : value.toString();
    };

    // Handle search input change with real-time updates
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        // Update URL with search query for better UX (back/forward navigation)
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set('search', value);
        } else {
            params.delete('search');
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
    };
    
    // Effect to handle search when searchTerm or publications change
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredPublications(publications);
            return;
        }
        
        const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        
        const filtered = publications.filter((pub: Publication) => {
            const title = pub.title?.toLowerCase() || '';
            const filename = pub.original_filename?.toLowerCase() || '';
            
            // Check for exact title match first
            if (searchTerms.length === 1 && title === searchTerm.toLowerCase().trim()) {
                return true;
            }
            
            // Check if all search terms are in the title
            const allInTitle = searchTerms.every((term: string) => title.includes(term));
            if (allInTitle) return true;
            
            // Check if any search term is in the title
            const anyInTitle = searchTerms.some((term: string) => title.includes(term));
            
            // Check other fields if no matches in title
            if (!anyInTitle) {
                const searchableText = [
                    filename,
                    pub.code?.toLowerCase() || '',
                    pub.description?.toLowerCase() || '',
                    pub.type?.toLowerCase() || '',
                    pub.year?.toString() || '',
                    pub.month ? new Date(2000, pub.month - 1, 1).toLocaleString('default', { month: 'long' }).toLowerCase() : '',
                    getPubName(pub).toLowerCase()
                ].join(' ');
                
                return searchTerms.every((term: string) => searchableText.includes(term));
            }
            
            return true;
        });
        
        setFilteredPublications(filtered);
    }, [searchTerm, publications]);

    // Initialize data and handle URL search parameter on component mount
    useEffect(() => {
        if (serverData) {
            setPublications(serverData.data);
            setFilteredPublications(serverData.data);
            setPagination({
                current_page: serverData.current_page,
                last_page: serverData.last_page,
                per_page: serverData.per_page,
                total: serverData.total,
                links: serverData.links
            });
            
            // Set all years as expanded by default
            const years = new Set<number>();
            serverData.data.forEach((pub: Publication) => {
                if (pub.year) years.add(pub.year);
            });
            
            const expanded: Record<number, boolean> = {};
            years.forEach(year => expanded[year] = true);
            setExpandedYears(expanded);
            
            setIsLoading(false);
        }
        
        // Initialize search term from URL if present
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get('search');
        if (searchParam) {
            setSearchTerm(searchParam);
        }
    }, [serverData]);
            
    // Group publications by name, year, month, day, and page for display
    const { nameGroups, sortedNames } = useMemo(() => {
        const dataToGroup = searchTerm ? filteredPublications : publications;
        const result: Record<string, Record<number, Record<number, Record<number, Record<number, Publication[]>>>>> = {};

        for (const pub of dataToGroup || []) {
            const name = getPubName(pub);
            const year = pub.year || 0;
            const month = pub.month || 0;
            const day = pub.day || 0;
            const page = getPageFromFilename(pub);
            result[name] ??= {};
            result[name][year] ??= {};
            result[name][year][month] ??= {};
            result[name][year][month][day] ??= {};
            result[name][year][month][day][page] ??= [];
            result[name][year][month][day][page].push(pub);
        }

        const nameGroups: NameGroup[] = Object.keys(result)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => {
                const yearsObj = result[name];
                const years: YearGroup[] = Object.keys(yearsObj)
                    .map(Number)
                    .sort((a, b) => b - a)
                    .map((year) => {
                        const monthsObj = yearsObj[year];
                        const months: MonthGroup[] = Object.keys(monthsObj)
                            .map(Number)
                            .sort((a, b) => b - a)
                            .map((month) => {
                                const daysObj = monthsObj[month];
                                const days: DayGroup[] = Object.keys(daysObj)
                                    .map(Number)
                                    .sort((a, b) => b - a)
                                    .map((day) => {
                                        const pagesObj = daysObj[day];
                                        const pages: PageGroup[] = Object.keys(pagesObj)
                                            .map(Number)
                                            .sort((a, b) => a - b)
                                            .map((page) => [page, pagesObj[page]]);
                                        return [day, pages];
                                    });
                                return [month, days];
                            });
                        return [year, months];
                    });
                return [name, years];
            });

        const sortedNames = nameGroups.map(([name]) => name);
        return { nameGroups, sortedNames };
    }, [filteredPublications, publications, searchTerm]);

    // Toggle name expansion
    const toggleName = (name: string) => {
        setExpandedNames(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    // Toggle year expansion
    const toggleYear = (name: string, year: number) => {
        const key = `${name}::${year}`;
        setExpandedYears(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Initialize expanded names with all names expanded by default
    useEffect(() => {
        if (!sortedNames.length) return;
        const initNames: Record<string, boolean> = {};
        sortedNames.forEach((n) => (initNames[n] = true));
        setExpandedNames((prev) => ({ ...initNames, ...prev }));
    }, [sortedNames]);
    
    // Toggle month expansion
    const toggleMonth = (name: string, year: number, month: number) => {
        const key = `${name}::${year}-${month}`;
        setExpandedMonths(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    
    // Toggle date expansion
    const toggleDate = (name: string, year: number, month: number, day: number) => {
        const key = `${name}::${year}-${month}-${day}`;
        setExpandedDates(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Get relative date string (e.g., '2 months ago')
    const getRelativeDate = (year: number, month: number): string => {
        if (!month) return '';
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
        
        if (year === currentYear && month === currentMonth) {
            return 'This month';
        }
        
        const monthDiff = (currentYear - year) * 12 + (currentMonth - month);
        
        if (monthDiff < 1) return 'This month';
        if (monthDiff === 1) return 'Last month';
        if (monthDiff < 12) return `${monthDiff} months ago`;
        
        const years = Math.floor(monthDiff / 12);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    };

    // Initialize data
    useEffect(() => {
        console.log('Server data received:', serverData);
        
        // Handle different possible server response formats
        let publicationsData: Publication[] = [];
        
        if (Array.isArray(serverData)) {
            // Case 1: Server returns an array directly
            publicationsData = serverData;
        } else if (serverData && typeof serverData === 'object' && 'data' in serverData) {
            // Case 2: Server returns an object with a data property
            const data = serverData as { data: any };
            if (Array.isArray(data.data)) {
                publicationsData = data.data;
            }
        }
        
        console.log('Processed publications data:', publicationsData);
        
        if (publicationsData && publicationsData.length > 0) {
            console.log(`Found ${publicationsData.length} publications`);
            setPublications(publicationsData);
            setFilteredPublications(publicationsData);
            setPagination({
                current_page: 1,
                last_page: 1,
                per_page: publicationsData.length,
                total: publicationsData.length,
                links: []
            });
        } else {
            console.log('No valid publications data found');
            setPublications([]);
        }
        setIsLoading(false);
    }, [serverData]);

    // Format file size to human readable format
    const formatFileSize = (bytes: number): string => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format date to readable format
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    };

    // Handle search
    const handleSearch = (search: string) => {
        router.get(route('publications.index'), { search }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Handle right-click context menu
    const handleContextMenu = (e: React.MouseEvent, pub: Publication) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            publication: pub
        });
    };

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    // Open PDF from context menu
    const handleOpenPDF = async (pub: Publication) => {
        const filename = pub.original_filename.split('/').pop() || '';
        const [fname, year, month, dayWithPage] = filename.split('-');
        const day = dayWithPage ? dayWithPage.substring(0, 2) : '';
        const lowerName = (fname || '').toLowerCase();
        const pageFromFn = dayWithPage ? dayWithPage.substring(2).split('.')[0] : '';
        
        try {
            // Generate secure token
            const response = await fetch('/api/pdf/generate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ publication_id: pub.id })
            });

            if (!response.ok) throw new Error('Failed to generate token');
            
            const { token } = await response.json();
            const secureUrl = `/api/pdf/view/${token}`;

            setViewingPdf({
                url: secureUrl,
                name: lowerName,
                year: year,
                month: month,
                day: day,
                page: pageFromFn,
                filename: pub.original_filename
            });
        } catch (error) {
            console.error('Error opening PDF:', error);
            toast.error('Failed to open PDF');
        }
        setContextMenu(null);
    };

    // Initialize data
    useEffect(() => {
        if (serverData) {
            setPublications(serverData.data);
            setFilteredPublications(serverData.data);
            setPagination({
                current_page: serverData.current_page,
                last_page: serverData.last_page,
                per_page: serverData.per_page,
                total: serverData.total,
                links: serverData.links
            });
            setIsLoading(false);
        }
    }, [serverData]);
    
    // Load search term from URL on initial load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get('search');
        if (searchParam) {
            setSearchTerm(searchParam);
            // Trigger search with the loaded term
            const searchEvent = { target: { value: searchParam } } as React.ChangeEvent<HTMLInputElement>;
            handleSearchChange(searchEvent);
        }
    }, []);


    // Handle delete (permission-based)
    const handleDelete = (id: string | number) => {
        if (!canDelete) {
            toast.error('You do not have permission to delete publications');
            return;
        }

        if (confirm('Are you sure you want to delete this publication? It will be moved to deleted publications.')) {
            router.delete(route('publications.destroy', id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Publication moved to deleted publications');
                    const updatedPublications = publications.filter(pub => pub.id !== id);
                    setPublications(updatedPublications);
                    // Update filtered publications with the updated list
                    setFilteredPublications(updatedPublications);
                },
                onError: (errors) => {
                    const errorMessage = errors?.message || 'Failed to delete publication';
                    toast.error(errorMessage);
                },
            });
        }
    };

    // Handle view
    const handleView = (id: string | number) => {
        router.get(route('publications.show', id));
    };

    // Log the current state for debugging
    console.log('Rendering with publications:', publications);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Publications', href: '/publications' },
            ]}
        >
            <Head title="Publications" />
            
            <div className="container mx-auto py-6 px-4">
                <div className="flex flex-col space-y-6">
                    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-bold tracking-tight">Publications</h1>
                        <Button asChild>
                            <Link href={route('publications.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Publication
                            </Link>
                        </Button>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Search by name, type, or use the format: <span className="font-mono bg-muted px-2 py-1 rounded">name-year-month-date-page</span> (e.g., din-1965-08-03-0001)
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search publications..."
                                    className="w-full rounded-lg bg-background pl-8"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-5 rounded-md" />
                                            <Skeleton className="h-6 w-48" />
                                            <Skeleton className="h-5 w-10 ml-2" />
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : !filteredPublications || filteredPublications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-30" />
                            <p className="text-lg font-medium">
                                {searchTerm ? 'No matching publications found' : 'No publications found'}
                            </p>
                            <p className="text-sm">
                                {searchTerm ? 'Try a different search term' : 'Upload your first publication to get started'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {nameGroups.map(([name, years]) => {
                                const nameExpanded = !!expandedNames[name];
                                const nameTotal = years.reduce(
                                    (acc, [, months]) =>
                                        acc +
                                        months.reduce(
                                            (a2, [, days]) =>
                                                a2 +
                                                days.reduce(
                                                    (a3, [, pages]) =>
                                                        a3 + pages.reduce((a4, [, pubs]) => a4 + pubs.length, 0),
                                                    0
                                                ),
                                            0
                                        ),
                                    0
                                );

                                return (
                                    <div key={name} className="mb-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
                                        {/* NAME header */}
                                        <button
                                            onClick={() => toggleName(name)}
                                            className="w-full text-left p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 flex items-center justify-between transition-all duration-300 group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-3 h-10 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full shadow-md group-hover:shadow-lg transition-shadow"></div>
                                                <div className="flex flex-col">
                                                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{name}</h2>
                                                    <p className="text-sm text-gray-500 mt-1">Publication Collection</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 shadow-sm">
                                                        {nameTotal} {nameTotal === 1 ? 'item' : 'items'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-500 font-medium">
                                                    {nameExpanded ? 'Collapse' : 'Expand'}
                                                </span>
                                                <ChevronDown
                                                    className={`h-6 w-6 text-indigo-500 transition-all duration-300 group-hover:text-indigo-600 ${nameExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                        </button>

                                        {/* YEARS under NAME */}
                                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${nameExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50">
                                                {years.map(([year, months]) => {
                                                    const yKey = `${name}::${year}`;
                                                    const yExpanded = !!expandedYears[yKey];

                                                    return (
                                                        <div
                                                            key={yKey}
                                                            className="mb-4 border border-gray-300 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-white"
                                                        >
                                                            <button
                                                                onClick={() => toggleYear(name, year)}
                                                                className="w-full text-left p-5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 flex items-center justify-between transition-all duration-300 group"
                                                            >
                                                                <div className="flex items-center space-x-4">
                                                                    <div className="w-2.5 h-9 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full shadow-sm group-hover:shadow-md transition-shadow"></div>
                                                                    <div className="flex flex-col">
                                                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{year}</h3>
                                                                        <p className="text-xs text-gray-500 mt-0.5">Year Collection</p>
                                                                    </div>
                                                                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 shadow-sm">
                                                                        {months.reduce((a, [, d]) => a + d.reduce((x, [, p]) => x + p.reduce((y, [, pp]) => y + pp.length, 0), 0), 0)} items
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm text-gray-500 font-medium">
                                                                        {yExpanded ? 'Collapse' : 'Expand'}
                                                                    </span>
                                                                    <ChevronDown className={`h-5 w-5 text-emerald-500 transition-all duration-300 group-hover:text-emerald-600 ${yExpanded ? 'rotate-180' : ''}`} />
                                                                </div>
                                                            </button>

                                                            <div className={`transition-all duration-400 ease-in-out overflow-hidden ${yExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                                <div className="divide-y divide-gray-200 bg-gradient-to-br from-white to-gray-50">
                                                                    {months.map(([month, days]) => {
                                                                        const monthKey = `${name}::${year}-${month}`;
                                                                        const mExpanded = !!expandedMonths[monthKey];
                                                                        const monthName = month ? new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }) : 'Unknown Month';

                                                                        return (
                                                                            <div key={monthKey} className="bg-white hover:bg-gray-50 transition-colors duration-200">
                                                                                <button
                                                                                    onClick={() => toggleMonth(name, year, month)}
                                                                                    className="w-full text-left p-4 pl-16 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 flex items-center justify-between transition-all duration-300 group"
                                                                                >
                                                                                    <div className="flex items-center space-x-3">
                                                                                        <div
                                                                                            className="w-2 h-7 rounded-full shadow-sm group-hover:shadow-md transition-shadow"
                                                                                            style={{ backgroundColor: `hsl(${(month * 30) % 360}, 65%, 75%)` }}
                                                                                        />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-semibold text-gray-800 group-hover:text-orange-700 transition-colors">
                                                                                                {monthName}
                                                                                            </span>
                                                                                            <span className="text-xs text-gray-500 mt-0.5">
                                                                                                {days.reduce((a, [, pages]) => a + pages.reduce((x, [, pubs]) => x + pubs.length, 0), 0)} publications
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <ChevronDown className={`h-4 w-4 text-orange-500 transition-all duration-300 group-hover:text-orange-600 ${mExpanded ? 'rotate-180' : ''}`} />
                                                                                </button>

                                                                                <div className={`transition-all duration-400 ease-in-out overflow-hidden ${mExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                                                    <div className="divide-y divide-gray-200 bg-gradient-to-br from-orange-25 to-amber-25">
                                                                                        {days.map(([day, pages]) => {
                                                                                            const dateKey = `${name}::${year}-${month}-${day}`;
                                                                                            const dExpanded = !!expandedDates[dateKey];
                                                                                            const dateLabel = day ? new Date(year, month - 1, day).toLocaleDateString('en-US', {
                                                                                                weekday: 'long',
                                                                                                year: 'numeric',
                                                                                                month: 'long',
                                                                                                day: 'numeric',
                                                                                            }) : 'Unknown Date';
                                                                                            const dateCount = pages.reduce((a, [, pubs]) => a + pubs.length, 0);

                                                                                            return (
                                                                                                <div key={dateKey} className="bg-white border-l-4 border-l-rose-200 hover:border-l-rose-400 transition-colors duration-200">
                                                                                                    <button
                                                                                                        onClick={() => toggleDate(name, year, month, day)}
                                                                                                        className="w-full text-left p-4 pl-20 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 flex items-center justify-between transition-all duration-300 group"
                                                                                                    >
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div
                                                                                                                className="w-2 h-6 rounded-full shadow-sm group-hover:shadow-md transition-shadow"
                                                                                                                style={{ backgroundColor: `hsl(${(day * 10) % 360}, 60%, 70%)` }}
                                                                                                            />
                                                                                                            <div className="flex flex-col">
                                                                                                                <span className="font-semibold text-gray-800 group-hover:text-rose-700 transition-colors text-sm">
                                                                                                                    {dateLabel}
                                                                                                                </span>
                                                                                                                <span className="text-xs text-gray-500 mt-0.5">
                                                                                                                    {dateCount} {dateCount === 1 ? 'document' : 'documents'}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <ChevronDown className={`h-4 w-4 text-rose-500 transition-all duration-300 group-hover:text-rose-600 ${dExpanded ? 'rotate-180' : ''}`} />
                                                                                                    </button>

                                                                                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${dExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                                                                        {pages.map(([page, pubs]) => (
                                                                                                            <div key={`${dateKey}-p${page}`} className="px-6 pt-4 pb-2 bg-gradient-to-br from-white to-gray-50">
                                                                                                                {page ? (
                                                                                                                    <div className="flex items-center mb-4">
                                                                                                                        <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full mr-3"></div>
                                                                                                                        <span className="text-sm font-bold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
                                                                                                                            Date : {String(page).padStart(4, '0')}
                                                                                                                        </span>
                                                                                                                    </div>
                                                                                                                ) : null}

                                                                                                                <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                                                                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                                                                        <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                                                                                                                            <tr className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                                                                                                <th className="px-6 py-4 text-left">Title</th>
                                                                                                                                <th className="px-6 py-4 text-left hidden md:table-cell">Type</th>
                                                                                                                                <th className="px-6 py-4 text-left hidden lg:table-cell">Date</th>
                                                                                                                                <th className="px-6 py-4 text-left hidden xl:table-cell">File</th>
                                                                                                                                <th className="px-6 py-4 text-left hidden 2xl:table-cell">Size</th>
                                                                                                                                <th className="px-6 py-4 text-right">Actions</th>
                                                                                                                            </tr>
                                                                                                                        </thead>
                                                                                                                        <tbody className="bg-white divide-y divide-gray-100">
                                                                                                                            {pubs.map((pub: Publication) => (
                                                                                                                                <tr 
                                                                                                                                    key={pub.id} 
                                                                                                                                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 group transition-all duration-200"
                                                                                                                                    onContextMenu={(e) => handleContextMenu(e, pub)}
                                                                                                                                    style={{ cursor: 'context-menu' }}
                                                                                                                                >
                                                                                                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                                                                                                        <div className="flex items-center space-x-4">
                                                                                                                                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-300 transition-all duration-300 shadow-sm group-hover:shadow-md">
                                                                                                                                                <FileText className="h-6 w-6 text-blue-700 group-hover:text-blue-800" />
                                                                                                                                            </div>
                                                                                                                                            <div className="min-w-0 flex-1">
                                                                                                                                                <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                                                                                                                                                    {pub.title || pub.original_filename || 'Untitled'}
                                                                                                                                                </div>
                                                                                                                                                {pub.description && (
                                                                                                                                                    <div className="text-sm text-gray-500 line-clamp-1">
                                                                                                                                                        {pub.description}
                                                                                                                                                    </div>
                                                                                                                                                )}
                                                                                                                                                <div className="md:hidden mt-1 flex flex-wrap gap-1">
                                                                                                                                                    {pub.type && (
                                                                                                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                                                                                                                                            {pub.type}
                                                                                                                                                        </span>
                                                                                                                                                    )}
                                                                                                                                                    <span className="text-xs text-gray-500">
                                                                                                                                                        {pub.year}
                                                                                                                                                        {pub.month && `-${String(pub.month).padStart(2, '0')}`}
                                                                                                                                                        {pub.day && `-${String(pub.day).padStart(2, '0')}`}
                                                                                                                                                    </span>
                                                                                                                                                </div>
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                                                    </td>
                                                                                                                                    <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                                                                                                                                        {pub.type && (
                                                                                                                                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-green-50 text-green-700">
                                                                                                                                                {pub.type}
                                                                                                                                            </span>
                                                                                                                                        )}
                                                                                                                                    </td>
                                                                                                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                                                                                                                                        <div className="flex flex-col">
                                                                                                                                            <span>
                                                                                                                                                {pub.year}
                                                                                                                                                {pub.month && `-${String(pub.month).padStart(2, '0')}`}
                                                                                                                                                {pub.day && `-${String(pub.day).padStart(2, '0')}`}
                                                                                                                                            </span>
                                                                                                                                            <span className="text-xs text-gray-400">
                                                                                                                                                {formatDate(pub.created_at)}
                                                                                                                                            </span>
                                                                                                                                        </div>
                                                                                                                                    </td>
                                                                                                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                                                                                                                                        {pub.original_filename ? (
                                                                                                                                            <div className="truncate max-w-xs">
                                                                                                                                                {pub.original_filename}
                                                                                                                                            </div>
                                                                                                                                        ) : (
                                                                                                                                            <span className="text-gray-400 text-sm">No file</span>
                                                                                                                                        )}
                                                                                                                                        <div className="text-xs text-gray-400">
                                                                                                                                            {pub.mime_type}
                                                                                                                                        </div>
                                                                                                                                    </td>
                                                                                                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden 2xl:table-cell">
                                                                                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                                                                                            {formatFileSize(pub.file_size)}
                                                                                                                                        </span>
                                                                                                                                    </td>
                                                                                                                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                                                                                        <div className="flex items-center justify-end gap-2">
                                                                                                                                            <Button
                                                                                                                                                variant="ghost"
                                                                                                                                                size="sm"
                                                                                                                                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                                                                                                                                title="View PDF in browser"
                                                                                                                                                onClick={async (e) => {
                                                                                                                                                    e.preventDefault();
                                                                                                                                                    const filename = pub.original_filename.split('/').pop() || '';
                                                                                                                                                    const [fname, year, month, dayWithPage] = filename.split('-');
                                                                                                                                                    const day = dayWithPage ? dayWithPage.substring(0, 2) : '';
                                                                                                                                                    const lowerName = (fname || '').toLowerCase();
                                                                                                                                                    const pageFromFn = dayWithPage ? dayWithPage.substring(2).split('.')[0] : '';
                                                                                                                                                    
                                                                                                                                                    try {
                                                                                                                                                        // Generate secure token
                                                                                                                                                        const response = await fetch('/api/pdf/generate-token', {
                                                                                                                                                            method: 'POST',
                                                                                                                                                            headers: {
                                                                                                                                                                'Content-Type': 'application/json',
                                                                                                                                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                                                                                                                            },
                                                                                                                                                            body: JSON.stringify({
                                                                                                                                                                name: lowerName,
                                                                                                                                                                year,
                                                                                                                                                                month,
                                                                                                                                                                day,
                                                                                                                                                                filename,
                                                                                                                                                            }),
                                                                                                                                                        });
                                                                                                                                                        
                                                                                                                                                        const data = await response.json();
                                                                                                                                                        
                                                                                                                                                        if (data.url) {
                                                                                                                                                            setViewingPdf({
                                                                                                                                                                url: data.url,
                                                                                                                                                                name: fname,
                                                                                                                                                                year,
                                                                                                                                                                month,
                                                                                                                                                                day,
                                                                                                                                                                page: pageFromFn,
                                                                                                                                                                filename,
                                                                                                                                                            });
                                                                                                                                                        }
                                                                                                                                                    } catch (error) {
                                                                                                                                                        console.error('Error generating PDF token:', error);
                                                                                                                                                    }
                                                                                                                                                }}
                                                                                                                                            >
                                                                                                                                                <FileText className="h-4 w-4" />
                                                                                                                                            </Button>
                                                                                                                                            {canDelete && (
                                                                                                                                                <Button
                                                                                                                                                    variant="ghost"
                                                                                                                                                    size="sm"
                                                                                                                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                                                                                                                    onClick={() => handleDelete(pub.id)}
                                                                                                                                                    title="Delete publication"
                                                                                                                                                >
                                                                                                                                                    <Trash2 className="h-4 w-4" />
                                                                                                                                                </Button>
                                                                                                                                            )}
                                                                                                                                        </div>
                                                                                                                                    </td>
                                                                                                                                </tr>
                                                                                                                            ))}
                                                                                                                        </tbody>
                                                                                                                    </table>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {viewingPdf && (
                <PDFViewer 
                    fileUrl={viewingPdf.url} 
                    fileName={viewingPdf.filename}
                    onClose={() => setViewingPdf(null)} 
                />
            )}

            {/* Custom Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[200px] z-[9999]"
                    style={{
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors"
                        onClick={() => handleOpenPDF(contextMenu.publication)}
                    >
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Open PDF</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 italic">
                        Save As and Print are disabled
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

export default Publications;
  