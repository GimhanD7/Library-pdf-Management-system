import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Mail, Phone, Building, Calendar, Search } from 'lucide-react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { format } from 'date-fns';
import { useState, useMemo, useEffect } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Input } from '@/components/ui/input';

type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: {
    id: number;
    name: string;
    slug: string;
  } | null;
  role_id: number | null;
  phone_number: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
};

type Role = {
  id: number;
  name: string;
  slug: string;
};

type Props = {
  users: User[];
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
    title: 'User Management',
    href: '/admin/users',
  },
];

export default function UsersIndex({ users: initialUsers, roles, auth }: Props) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [users, setUsers] = useState(initialUsers);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.role?.name.toLowerCase().includes(term) ?? false)
    );
  }, [users, searchTerm]);

  // Update users when initialUsers changes (e.g., after delete)
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  const pageProps = usePage().props as any;
  
  const can = pageProps?.auth?.can || {};

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      router.delete(route('admin.users.destroy', id));
    }
  };

  const handleEdit = (userId: number) => {
    router.visit(route('admin.users.edit', userId));
  };

  const getRoleBadge = (role: { name: string; slug: string } | null) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;
    
    const variant = role.slug === 'admin' ? 'destructive' : 
                   role.slug === 'librarian' ? 'secondary' : 'default';
    
    return <Badge variant={variant}>{role.name}</Badge>;
  };

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title="Users" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground text-lg">
              Manage all users and their permissions
            </p>
          </div>
          {can?.create_users && (
            <Button size="lg" asChild>
              <Link href={route('admin.users.create')}>
                <Plus className="mr-2 h-5 w-5" />
                Add User
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription className="mt-1">
                  A list of all users with their roles and permissions
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead className="w-[200px]">Contact</TableHead>
                  <TableHead className="w-[120px] text-center">Role</TableHead>
                  <TableHead className="w-[150px] text-center">Department</TableHead>
                  <TableHead className="w-[120px] text-center">Joined</TableHead>
                  <TableHead className="w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredUsers || filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {users.length === 0 ? 'No users found' : searchTerm ? 'No matching users found' : 'No users found'}. Create your first user to get started.'
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-semibold text-base">{user.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="mr-2 h-3 w-3" />
                            {user.email || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.phone_number ? (
                          <div className="flex items-center text-sm">
                            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.phone_number}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">No phone</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getRoleBadge(user.role)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.department ? (
                          <div className="flex items-center justify-center text-sm">
                            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.department}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm text-muted-foreground flex items-center justify-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span className="font-medium">
                            {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          {can?.edit_users && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary hover:bg-primary/10"
                              onClick={() => handleEdit(user.id)}
                              title="Edit user"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}
                          {can?.delete_users && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(user.id)}
                              title="Delete user"
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
          <CardFooter className="border-t px-6 py-4 bg-muted/50">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                Showing <strong className="text-foreground">{users?.length || 0}</strong> user{(users?.length || 0) !== 1 ? 's' : ''} total
              </p>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AdminLayoutWithSidebar>
  );
}