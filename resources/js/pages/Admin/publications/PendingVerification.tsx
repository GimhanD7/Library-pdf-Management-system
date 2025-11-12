import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
    FileText, 
    Eye, 
    Check, 
    X, 
    Search, 
    Calendar,
    User,
    Clock,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface Props {
    tempPublications: {
        data: TempPublication[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
    };
}

export default function PendingVerification({ tempPublications, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
    const [viewingPdf, setViewingPdf] = useState<string | null>(null);
    const [confirmingApprove, setConfirmingApprove] = useState<TempPublication | null>(null);
    const [confirmingReject, setConfirmingReject] = useState<TempPublication | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const { data, setData, post, processing } = useForm({
        notes: '',
        reason: ''
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.publications.pending'), 
            { search: searchQuery },
            { preserveState: true, replace: true }
        );
    };

    const handleApprove = async (tempPublication: TempPublication, notes?: string) => {
        if (processingIds.has(tempPublication.id)) return;

        setProcessingIds(prev => new Set(prev).add(tempPublication.id));

        try {
            // Get fresh CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                toast.error('CSRF token not found. Please refresh the page.');
                return;
            }

            const response = await fetch(route('admin.publications.approve', tempPublication.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ notes: notes || '' })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                toast.success('Publication approved successfully');
                // Reload the page to refresh the list
                router.reload({ only: ['tempPublications'] });
            } else {
                // Handle specific error types
                if (response.status === 403) {
                    toast.error('Access denied. Please check your permissions or log in again.');
                    // Optionally redirect to login
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else if (response.status === 419) {
                    toast.error('Session expired. Please refresh the page and try again.');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    // Show the specific error message from the server
                    const errorMessage = result.message || `Failed to approve publication (${response.status})`;
                    
                    // Show more helpful message for file not found errors
                    if (result.message && result.message.includes('File not found')) {
                        toast.error('Cannot approve: Publication file is missing. Please contact administrator to fix this issue.');
                    } else {
                        toast.error(errorMessage);
                    }
                }
                console.error('Approval error:', result);
            }
        } catch (error) {
            console.error('Error approving publication:', error);
            toast.error('An error occurred while approving the publication');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(tempPublication.id);
                return newSet;
            });
        }
    };

    const handleReject = async (tempPublication: TempPublication, reason: string) => {
        if (!reason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        if (processingIds.has(tempPublication.id)) return;

        setProcessingIds(prev => new Set(prev).add(tempPublication.id));

        try {
            const response = await fetch(route('admin.publications.reject', tempPublication.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ reason })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                toast.success('Publication rejected successfully');
                router.reload({ only: ['tempPublications'] });
            } else {
                toast.error(result.message || 'Failed to reject publication');
            }
        } catch (error) {
            console.error('Error rejecting publication:', error);
            toast.error('An error occurred while rejecting the publication');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(tempPublication.id);
                return newSet;
            });
        }
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

    return (
        <AdminLayoutWithSidebar 
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Pending Verification', href: '/admin/publications/pending' },
            ]}
        >
            <Head title="Pending Verification - Publications" />
            
            <div className="flex h-full flex-1 flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pending Verification</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Review and approve publications submitted by users
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('admin.publications.history')}>
                                View History
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
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
                    {filters.search && (
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                                setSearchQuery('');
                                router.get(route('admin.publications.pending'));
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </form>

                {/* Publications List */}
                <div className="space-y-4">
                    {tempPublications.data.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                            <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                            <p className="text-muted-foreground">
                                No publications are currently pending verification.
                            </p>
                        </div>
                    ) : (
                        tempPublications.data.map((tempPublication) => (
                            <div key={tempPublication.id} className="border rounded-lg p-6 bg-card">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1">
                                                    {tempPublication.title || tempPublication.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {tempPublication.original_filename}
                                                </p>
                                                {tempPublication.description && (
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {tempPublication.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Pending
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{tempPublication.user.name}</div>
                                                    <div className="text-muted-foreground">{tempPublication.user.email}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">
                                                        {tempPublication.year && tempPublication.month && tempPublication.day
                                                            ? `${tempPublication.year}-${String(tempPublication.month).padStart(2, '0')}-${String(tempPublication.day).padStart(2, '0')}`
                                                            : 'No date'
                                                        }
                                                    </div>
                                                    {tempPublication.page && (
                                                        <div className="text-muted-foreground">Page {tempPublication.page}</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="font-medium">{formatFileSize(tempPublication.file_size)}</div>
                                                <div className="text-muted-foreground">File size</div>
                                            </div>
                                            
                                            <div>
                                                <div className="font-medium">{formatDate(tempPublication.created_at)}</div>
                                                <div className="text-muted-foreground">Uploaded</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setViewingPdf(route('admin.publications.view-temp', tempPublication.id))}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View PDF
                                            </Button>
                                            
                                            <Button
                                                size="sm"
                                                onClick={() => setConfirmingApprove(tempPublication)}
                                                disabled={processingIds.has(tempPublication.id)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                {processingIds.has(tempPublication.id) ? 'Approving...' : 'Approve'}
                                            </Button>
                                            
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    setConfirmingReject(tempPublication);
                                                    setRejectReason('');
                                                }}
                                                disabled={processingIds.has(tempPublication.id)}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                {processingIds.has(tempPublication.id) ? 'Rejecting...' : 'Reject'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {tempPublications.links && tempPublications.links.length > 3 && (
                    <div className="flex justify-center">
                        <div className="flex gap-1">
                            {tempPublications.links.map((link: any, index: number) => (
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

            {/* Approve Confirmation Dialog */}
            <Dialog open={!!confirmingApprove} onOpenChange={(open) => !open && setConfirmingApprove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Publication</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this publication?
                            <br />
                            <strong className="text-foreground">{confirmingApprove?.title || confirmingApprove?.name}</strong>
                            <br />
                            This action will make the publication visible to all users.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmingApprove(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                                if (confirmingApprove) {
                                    handleApprove(confirmingApprove);
                                    setConfirmingApprove(null);
                                }
                            }}
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Confirmation Dialog */}
            <Dialog open={!!confirmingReject} onOpenChange={(open) => !open && setConfirmingReject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Publication</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this publication?
                            <br />
                            <strong className="text-foreground">{confirmingReject?.title || confirmingReject?.name}</strong>
                            <br />
                            Please provide a reason for rejection.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="reject-reason" className="text-sm font-medium">
                                Reason for rejection <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                id="reject-reason"
                                placeholder="Please explain why this publication is being rejected..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="mt-1.5"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setConfirmingReject(null);
                                setRejectReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirmingReject && rejectReason.trim()) {
                                    handleReject(confirmingReject, rejectReason);
                                    setConfirmingReject(null);
                                    setRejectReason('');
                                } else {
                                    toast.error('Please provide a reason for rejection');
                                }
                            }}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayoutWithSidebar>
    );
}
