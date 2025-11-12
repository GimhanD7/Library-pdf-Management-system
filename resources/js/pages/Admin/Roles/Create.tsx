import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft, Shield } from 'lucide-react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

type Permission = {
  id: number;
  name: string;
  description: string | null;
  group: string;
};

type Props = {
  permissions: Permission[];
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
  {
    title: 'Add Role',
    href: '/admin/roles/create',
  },
];

export default function CreateRole({ permissions, auth }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    slug: '',
    description: '',
    is_default: false,
    permissions: [] as number[],
  });

  const [slugLocked, setSlugLocked] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post(route('admin.roles.store'), {
      onSuccess: () => {
        // The page will reload automatically due to Inertia's response handling
      },
    });
  };

  const generateSlug = (name: string) => {
    if (!slugLocked) {
      setData('slug', name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
    }
  };

  const togglePermission = (permissionId: number) => {
    setData('permissions', 
      data.permissions.includes(permissionId)
        ? data.permissions.filter((id: number) => id !== permissionId)
        : [...data.permissions, permissionId]
    );
  };

  const handleDefaultChange = (checked: boolean) => {
    (setData as any)('is_default', checked);
  };

  // Group permissions by their group
  const groupedPermissions = (permissions || []).reduce<Record<string, typeof permissions>>((groups, permission) => {
    const group = permission.group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(permission);
    return groups;
  }, {});

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title="Add Role" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Role</h1>
            <p className="text-muted-foreground">
              Create a new role with specific permissions
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.roles.index')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Information</CardTitle>
                <CardDescription>
                  Enter the details for the new role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Role Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Content Manager"
                      value={data.name}
                      onChange={(e) => {
                        setData('name', e.target.value);
                        generateSlug(e.target.value);
                      }}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="slug">Slug *</Label>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Switch
                            id="lock-slug"
                            checked={slugLocked}
                            onCheckedChange={setSlugLocked}
                          />
                          <Label htmlFor="lock-slug" className="text-xs text-muted-foreground">
                            {slugLocked ? 'Locked' : 'Auto-generate'}
                          </Label>
                        </div>
                      </div>
                    </div>
                    <Input
                      id="slug"
                      placeholder="e.g. content-manager"
                      value={data.slug}
                      onChange={(e) => setData('slug', e.target.value)}
                      disabled={!slugLocked}
                      className={!slugLocked ? 'bg-muted/50' : ''}
                    />
                    {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of this role"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={3}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={data.is_default}
                    onCheckedChange={handleDefaultChange}
                  />
                  <Label htmlFor="is_default" className="cursor-pointer">
                    Set as default role for new users
                  </Label>
                </div>
                {errors.is_default && <p className="text-sm text-red-500">{errors.is_default}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Select the permissions to assign to this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedPermissions).length > 0 ? (
                  Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
                    <div key={group} className="mb-6 last:mb-0">
                      <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
                        {group}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={data.permissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label htmlFor={`permission-${permission.id}`} className="text-sm font-normal cursor-pointer">
                              <div className="font-medium">{permission.name}</div>
                              {permission.description && (
                                <div className="text-xs text-muted-foreground">
                                  {permission.description}
                                </div>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No permissions available</p>
                  </div>
                )}
                {errors.permissions && (
                  <p className="text-sm text-red-500 mt-2">{errors.permissions}</p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.roles.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Creating...' : 'Create Role'}
                <Shield className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayoutWithSidebar>
  );
}
