import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Trash2, Download, Search, AlertCircle, Archive, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DeletedPublication {
    id: number;
    original_id: number;
    name: string;
    title: string;
    original_filename: string;
    file_path: string;
    file_url: string;
    file_size: number;
    year: number;
    month?: number;
    day?: number;
    page?: number;
    type: string;
    deleted_by_name: string;
    deleted_at: string;
    original_created_at: string;
    file_exists: boolean;
}

interface Props {
    deletedPublications: {
        data: DeletedPublication[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search?: string;
    };
}

export default function DeletedPublications({ deletedPublications, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; publication: DeletedPublication | null }>({
        open: false,
        publication: null,
    });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; publication: DeletedPublication | null }>({
        open: false,
        publication: null,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/publications/deleted', { search: searchTerm }, { preserveState: true });
    };

    const openRestoreDialog = (publication: DeletedPublication) => {
        setRestoreDialog({ open: true, publication });
    };

    const openDeleteDialog = (publication: DeletedPublication) => {
        setDeleteDialog({ open: true, publication });
    };

    const handleRestore = () => {
        if (!restoreDialog.publication) return;

        router.post(
            `/admin/publications/deleted/${restoreDialog.publication.id}/restore`,
            {},
            {
                onSuccess: () => {
                    toast.success('Publication restored successfully');
                    setRestoreDialog({ open: false, publication: null });
                },
                onError: () => {
                    toast.error('Failed to restore publication');
                },
            }
        );
    };

    const handlePermanentDelete = () => {
        if (!deleteDialog.publication) return;

        router.delete(`/admin/publications/deleted/${deleteDialog.publication.id}`, {
            onSuccess: () => {
                toast.success('Publication permanently deleted');
                setDeleteDialog({ open: false, publication: null });
            },
            onError: () => {
                toast.error('Failed to permanently delete publication');
            },
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch {
            return dateString;
        }
    };

    return (
        <AdminLayoutWithSidebar
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Deleted Publications', href: '/admin/publications/deleted' },
            ]}
        >
            <Head title="Deleted Publications" />

            <div className="flex h-full flex-1 flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Deleted Publications</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage deleted publications - restore or permanently remove them
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                            <Archive className="h-3 w-3 mr-1" />
                            {deletedPublications.total} Deleted
                        </Badge>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/admin/publications/history">
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
                            placeholder="Search by title, name, or filename..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit">Search</Button>
                    {searchTerm && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setSearchTerm('');
                                router.get('/admin/publications/deleted');
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </form>

                {/* Deleted Publications Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Deleted Publications</CardTitle>
                        <CardDescription>
                            These publications have been soft-deleted and can be restored or permanently removed
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {deletedPublications.data.length === 0 ? (
                            <div className="text-center py-12">
                                <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No deleted publications found</p>
                                {searchTerm && (
                                    <p className="text-gray-400 text-sm mt-2">
                                        Try adjusting your search criteria
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Size</TableHead>
                                                <TableHead>Deleted By</TableHead>
                                                <TableHead>Deleted At</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {deletedPublications.data.map((pub) => (
                                                <TableRow key={pub.id}>
                                                    <TableCell className="font-medium max-w-xs">
                                                        <div className="flex items-start gap-2">
                                                            <FileText className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                                                            <div className="min-w-0">
                                                                <div className="truncate">
                                                                    {pub.title || pub.original_filename}
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {pub.original_filename}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{pub.name}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{pub.type}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {pub.year}-
                                                            {pub.month ? String(pub.month).padStart(2, '0') : '??'}-
                                                            {pub.day ? String(pub.day).padStart(2, '0') : '??'}
                                                        </div>
                                                        {pub.page && (
                                                            <div className="text-xs text-gray-500">
                                                                Page {pub.page}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {formatFileSize(pub.file_size)}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {pub.deleted_by_name}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {formatDate(pub.deleted_at)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {pub.file_exists ? (
                                                            <Badge variant="default" className="bg-green-500">
                                                                File OK
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="gap-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                Missing
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-2">
                                                            {pub.file_exists && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => window.open(pub.file_url, '_blank')}
                                                                    title="View PDF"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openRestoreDialog(pub)}
                                                                title="Restore publication"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            >
                                                                <RotateCcw className="h-4 w-4 mr-1" />
                                                                Restore
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openDeleteDialog(pub)}
                                                                title="Permanently delete"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {deletedPublications.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-gray-500">
                                            Showing {deletedPublications.data.length} of {deletedPublications.total} deleted publications
                                        </div>
                                        <div className="flex gap-1">
                                            {deletedPublications.links.map((link, index) => (
                                                <Button
                                                    key={index}
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => link.url && router.get(link.url)}
                                                    disabled={!link.url}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Restore Confirmation Dialog */}
            <Dialog open={restoreDialog.open} onOpenChange={(open) => setRestoreDialog({ open, publication: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-green-600" />
                            Restore Publication
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to restore this publication?
                        </DialogDescription>
                    </DialogHeader>
                    {restoreDialog.publication && (
                        <div className="py-4">
                            <div className="space-y-2 text-sm">
                                <p className="font-semibold">{restoreDialog.publication.title || restoreDialog.publication.original_filename}</p>
                                <p className="text-gray-500">
                                    <span className="font-medium">Name:</span> {restoreDialog.publication.name}
                                </p>
                                <p className="text-gray-500">
                                    <span className="font-medium">Type:</span> {restoreDialog.publication.type}
                                </p>
                            </div>
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-800">
                                    This will move the publication back to the active publications list and restore the file to its original location.
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRestoreDialog({ open: false, publication: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRestore}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore Publication
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permanent Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, publication: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Permanent Delete Warning
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone!
                        </DialogDescription>
                    </DialogHeader>
                    {deleteDialog.publication && (
                        <div className="py-4">
                            <div className="space-y-2 text-sm">
                                <p className="font-semibold">{deleteDialog.publication.title || deleteDialog.publication.original_filename}</p>
                                <p className="text-gray-500">
                                    <span className="font-medium">Name:</span> {deleteDialog.publication.name}
                                </p>
                                <p className="text-gray-500">
                                    <span className="font-medium">Type:</span> {deleteDialog.publication.type}
                                </p>
                            </div>
                            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-md">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-800">
                                        <p className="font-semibold mb-2">Warning: This will permanently:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Delete the PDF file from storage</li>
                                            <li>Remove the record from the database</li>
                                            <li>This action <span className="font-bold underline">CANNOT be undone</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, publication: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePermanentDelete}
                            variant="destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Permanently Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayoutWithSidebar>
    );
}
