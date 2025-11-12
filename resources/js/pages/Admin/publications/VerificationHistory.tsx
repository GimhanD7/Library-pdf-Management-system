import { Head, Link, router } from '@inertiajs/react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
    FileText, 
    Eye, 
    Check, 
    X, 
    Search, 
    Calendar,
    User,
    Clock,
    MessageSquare,
    Filter,
    RotateCcw,
    AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import PDFViewer from '@/components/pdf-viewer';

interface TempPublication {
    id: number;
    name: string;
    title: string;
    description?: string;
    original_filename: string;
    file_path: string;
    file_url: string;
    file_size: number;
    year?: number;
    month?: number;
    day?: number;
    page?: number;
    status: 'approved' | 'rejected';
    admin_notes?: string;
    verified_at: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    verified_by: {
        id: number;
        name: string;
        email: string;
    };
}

interface Props {
    verificationHistory: {
        data: TempPublication[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function VerificationHistory({ verificationHistory, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [viewingPdf, setViewingPdf] = useState<string | null>(null);
    const [confirmingRevert, setConfirmingRevert] = useState<TempPublication | null>(null);
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.publications.history'), 
            { 
                search: searchQuery,
                status: statusFilter || undefined
            },
            { preserveState: true, replace: true }
        );
    };

    const handleStatusFilter = (status: string) => {
        const actualStatus = status === "all" ? "" : status;
        setStatusFilter(actualStatus);
        router.get(route('admin.publications.history'), 
            { 
                search: searchQuery,
                status: actualStatus || undefined
            },
            { preserveState: true, replace: true }
        );
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRevertToPending = async (item: TempPublication) => {
        if (processingIds.has(item.id)) return;

        setProcessingIds(prev => new Set(prev).add(item.id));

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                toast.error('CSRF token not found. Please refresh the page.');
                return;
            }

            const response = await fetch(route('admin.publications.revert', item.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                toast.success(`Publication reverted to pending status`);
                // Redirect to pending verification page
                router.visit(route('admin.publications.pending'));
            } else {
                toast.error(result.message || 'Failed to revert publication');
            }
        } catch (error) {
            console.error('Error reverting publication:', error);
            toast.error('An error occurred while reverting the publication');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'approved') {
            return (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Approved
                </Badge>
            );
        } else {
            return (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <X className="h-3 w-3 mr-1" />
                    Rejected
                </Badge>
            );
        }
    };

    return (
        <AdminLayoutWithSidebar 
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Verification History', href: '/admin/publications/history' },
            ]}
        >
            <Head title="Verification History - Publications" />
            
            <div className="flex h-full flex-1 flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Verification History</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View all approved and rejected publications
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('admin.publications.pending')}>
                                Pending Verification
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search publications, users, or filenames..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                    
                    <div className="flex gap-2">
                        <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        {(filters.search || filters.status) && (
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('');
                                    router.get(route('admin.publications.history'));
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-4">
                    {verificationHistory.data.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No verification history found</h3>
                            <p className="text-muted-foreground">
                                {filters.search || filters.status 
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No publications have been verified yet.'
                                }
                            </p>
                        </div>
                    ) : (
                        verificationHistory.data.map((item) => (
                            <div key={item.id} className="border rounded-lg p-6 bg-card">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1">
                                                    {item.title || item.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {item.original_filename}
                                                </p>
                                                {item.description && (
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                            {getStatusBadge(item.status)}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{item.user.name}</div>
                                                    <div className="text-muted-foreground">Submitted by</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{item.verified_by.name}</div>
                                                    <div className="text-muted-foreground">Verified by</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">
                                                        {item.year && item.month && item.day
                                                            ? `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
                                                            : 'No date'
                                                        }
                                                    </div>
                                                    {item.page && (
                                                        <div className="text-muted-foreground">Page {item.page}</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{formatDate(item.verified_at)}</div>
                                                    <div className="text-muted-foreground">Verified</div>
                                                </div>
                                            </div>
                                        </div>

                                        {item.admin_notes && (
                                            <div className="bg-muted/50 rounded-lg p-3 mb-4">
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <div className="font-medium text-sm mb-1">
                                                            {item.status === 'approved' ? 'Admin Notes' : 'Rejection Reason'}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.admin_notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setViewingPdf(route('admin.publications.view-temp', item.id))}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View PDF
                                                </Button>
                                                
                                                {/* Only show Revert button for rejected publications */}
                                                {item.status === 'rejected' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setConfirmingRevert(item)}
                                                        disabled={processingIds.has(item.id)}
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-1" />
                                                        {processingIds.has(item.id) ? 'Reverting...' : 'Revert to Pending'}
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            <div className="text-xs text-muted-foreground">
                                                {formatFileSize(item.file_size)} • 
                                                Uploaded {formatDate(item.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {verificationHistory.links && verificationHistory.links.length > 3 && (
                    <div className="flex justify-center">
                        <div className="flex gap-1">
                            {verificationHistory.links.map((link: any, index: number) => (
                                <Button
                                    key={index}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url}
                                    asChild={!!link.url}
                                >
                                    {link.url ? (
                                        <Link href={link.url} preserveState>
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    ) : (
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* PDF Viewer Modal */}
            {viewingPdf && (
                <PDFViewer
                    fileUrl={viewingPdf}
                    onClose={() => setViewingPdf(null)}
                />
            )}

            {/* Revert Confirmation Dialog */}
            <Dialog open={!!confirmingRevert} onOpenChange={(open) => !open && setConfirmingRevert(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Revert Rejected Publication
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revert this rejected publication back to pending status?
                            <br />
                            <strong className="text-foreground">{confirmingRevert?.title || confirmingRevert?.name}</strong>
                            <br />
                            <br />
                            <span className="text-sm">
                                This will move the publication back to pending, allowing it to be reviewed and approved again.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmingRevert(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => {
                                if (confirmingRevert) {
                                    handleRevertToPending(confirmingRevert);
                                    setConfirmingRevert(null);
                                }
                            }}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Revert to Pending
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayoutWithSidebar>
    );
}
