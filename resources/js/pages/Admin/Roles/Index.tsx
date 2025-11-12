import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Shield, Users as UsersIcon } from 'lucide-react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { format } from 'date-fns';
import { type BreadcrumbItem } from '@/types';

type Role = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  users_count: number;
  created_at: string;
  updated_at: string;
};

type Props = {
  roles: Role[];
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/admin/dashboard',
  },
  {
    title: 'Role Management',
    href: '/admin/roles',
  },
];

export default function RolesIndex({ roles, auth }: Props) {
  const pageProps = usePage().props as any;
  const can = pageProps?.auth?.can || {};

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      router.delete(route('admin.roles.destroy', id), {
        onSuccess: () => {
          // The page will reload automatically due to Inertia's response handling
        },
        onError: (errors) => {
          // Show error message if deletion fails
          alert(errors?.message || 'Failed to delete role');
        },
      });
    }
  };

  const handleEdit = (roleId: number) => {
    router.visit(route('admin.roles.edit', roleId));
  };

  const getRoleBadge = (isDefault: boolean) => {
    return isDefault ? (
      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
        Default
      </Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">
        Optional
      </Badge>
    );
  };

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title="Roles" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground text-lg">
              Manage all roles and their permissions
            </p>
          </div>
          {can?.create_roles && (
            <Button size="lg" asChild>
              <Link href={route('admin.roles.create')}>
                <Plus className="mr-2 h-5 w-5" />
                Add Role
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              A list of all roles in the system with their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Role</TableHead>
                  <TableHead className="w-[150px]">Slug</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-center">Users</TableHead>
                  <TableHead className="w-[150px] text-center">Created</TableHead>
                  <TableHead className="w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!roles || roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {!roles ? 'Loading roles...' : 'No roles found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role: Role) => (
                    <TableRow key={role.id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link 
                          href={route('admin.roles.edit', role.id)}
                          className="hover:underline hover:text-primary"
                        >
                          {role.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                          </div> */}
                          <div>
                            <div className="font-medium">{role.name}</div>
                            {role.description && (
                              <div className="text-sm text-muted-foreground">
                                {role.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                          {role.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        {getRoleBadge(role.is_default)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link 
                          href={`/admin/users?role=${role.id}`}
                          className="hover:underline hover:text-primary"
                          title={`View users with ${role.name} role`}
                        >
                          {role.users_count}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {format(new Date(role.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-1">
                          {can?.edit_roles && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => handleEdit(role.id)}
                              title="Edit role"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}
                          {!role.is_default && role.users_count === 0 && can?.delete_roles && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(role.id)}
                              title="Delete role"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{roles.length}</strong> role{roles.length !== 1 ? 's' : ''}
            </p>
          </CardFooter>
        </Card>
      </div>
    </AdminLayoutWithSidebar>
  );
}
