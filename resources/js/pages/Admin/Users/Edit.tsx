import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { type BreadcrumbItem } from '@/types';
import { type FormEvent } from 'react';

type User = {
  id: number;
  name: string;
  email: string;
  role_id: number | null;
  phone_number: string | null;
  department: string | null;
  role?: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

type Role = {
  id: number;
  name: string;
  slug: string;
};

type Props = {
  user: User;
  roles: Role[];
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
  {
    title: 'Edit User',
    href: '',
  },
];

export default function EditUser({ user, roles }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: user.name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    department: user.department || '',
    role: user.role?.slug || '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(route('admin.users.update', user.id), {
      onSuccess: () => {
        // Handle success (e.g., show toast)
        router.visit(route('admin.users.index'));
      },
    });
  };

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title={`Edit User - ${user.name}`} />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
            <p className="text-muted-foreground text-lg">
              Update user details and permissions
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Update the user's personal information and role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="user@example.com"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={data.phone_number || ''}
                    onChange={(e) => setData('phone_number', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={data.department || ''}
                    onChange={(e) => setData('department', e.target.value)}
                    placeholder="Engineering"
                  />
                  {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={data.role}
                    onValueChange={(value) => setData('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.slug}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-4">Change Password (leave blank to keep current password)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      placeholder="••••••••"
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      placeholder="••••••••"
                    />
                    {errors.password_confirmation && (
                      <p className="text-sm text-destructive">{errors.password_confirmation}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex items-center justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayoutWithSidebar>
  );
}
