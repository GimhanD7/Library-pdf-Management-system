import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AdminLayout from '@/layouts/AdminLayout.jsx';
import { FormEvent, ChangeEvent } from 'react';

type Permission = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  group: string;
};

type Role = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  is_default: boolean;
  permissions: number[];
};

type Props = {
  role?: Role;
  permissions: Permission[];
  auth: {
    user: any;
  };
  isEdit?: boolean;
};

export default function RoleForm({ role, permissions, auth, isEdit = false }: Props) {
  const { data, setData, post, put, processing, errors } = useForm<Role>(
    role || {
      name: '',
      slug: '',
      description: '',
      is_default: false,
      permissions: [],
    }
  );

  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    const group = permission.group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(permission);
    return groups;
  }, {});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (isEdit && role?.id) {
      put(route('admin.roles.update', role.id));
    } else {
      post(route('admin.roles.store'));
    }
  };

  const togglePermission = (permissionId: number) => {
    setData('permissions', (
      data.permissions.includes(permissionId)
        ? data.permissions.filter(id => id !== permissionId)
        : [...data.permissions, permissionId]
    ));
  };

  const toggleAllInGroup = (group: string, permissions: Permission[]) => {
    const allSelected = permissions.every(p => data.permissions.includes(p.id));
    
    setData('permissions', allSelected
      ? data.permissions.filter(id => !permissions.some(p => p.id === id))
      : [...new Set([...data.permissions, ...permissions.map(p => p.id)])]
    );
  };

  return (
    <AdminLayout>
      <Head title={isEdit ? 'Edit Role' : 'Create Role'} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Edit Role' : 'Create New Role'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit 
                ? 'Update the role details and permissions.'
                : 'Create a new role and assign permissions.'}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={route('admin.roles.index')}>
              Back to Roles
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Role Details</CardTitle>
                  <CardDescription>
                    Basic information about the role
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      placeholder="e.g. Content Manager"
                      required
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={data.slug}
                      onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="e.g. content-manager"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      A URL-friendly version of the name (lowercase, hyphens instead of spaces)
                    </p>
                    {errors.slug && (
                      <p className="text-sm text-destructive">{errors.slug}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={data.description}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                      placeholder="What does this role do?"
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between space-x-2 pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_default">Default Role</Label>
                      <p className="text-xs text-muted-foreground">
                        New users will be assigned this role by default
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={data.is_default}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setData('is_default', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={processing} className="w-full">
                    {processing ? 'Saving...' : 'Save Role'}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-6 md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>
                    Select the permissions this role should have
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
                    <div key={group} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{group}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllInGroup(group, groupPermissions)}
                        >
                          {groupPermissions.every(p => data.permissions.includes(p.id)) 
                            ? 'Deselect All' 
                            : 'Select All'}
                        </Button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {groupPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={data.permissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label htmlFor={`permission-${permission.id}`} className="text-sm font-normal">
                              {permission.name}
                              {permission.description && (
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
