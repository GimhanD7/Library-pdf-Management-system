import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { type BreadcrumbItem } from '@/types';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { ArrowLeft, Loader2, Save, Shield } from 'lucide-react';
import { FormEvent } from 'react';
// Using window.alert for simplicity - replace with your preferred notification system

type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  role: {
    name: string;
    slug: string;
  } | null;
};

type Permission = {
  id: number;
  name: string;
  description: string | null;
  group: string;
};

type Role = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  users: User[];
  permissions: number[];
};

type EditRoleProps = {
  role: Role;
  permissions: Permission[];
};

export default function EditRole({ role, permissions }: EditRoleProps) {
  const { data, setData, put, processing, errors, reset } = useForm({
    name: role?.name || '',
    slug: role?.slug || '',
    description: role?.description || '',
    is_default: role?.is_default || false,
    permissions: role?.permissions || [],
  });

  // Group permissions by their group
  const groupedPermissions = (permissions || []).reduce<Record<string, Permission[]>>((groups, permission) => {
    const group = permission.group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(permission);
    return groups;
  }, {});

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
    { title: 'Role Management', href: '/admin/roles' },
    { title: `Edit ${role?.name || 'Role'}`, href: role?.id ? `/admin/roles/${role.id}/edit` : '#' },
  ];

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const currentPermissions = data.permissions || [];
    if (checked) {
      setData('permissions', [...currentPermissions, permissionId]);
    } else {
      setData('permissions', currentPermissions.filter(id => id !== permissionId));
    }
  };

  const isPermissionChecked = (permissionId: number) => {
    return (data.permissions || []).includes(permissionId);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!role?.id) {
      console.error('Role ID is missing');
      return;
    }

    // Use Inertia's put method with proper typing
    put(route('admin.roles.update', role.id), {
      // The controller will handle the redirect and flash messages
    });
  };

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title={`Edit Role: ${role.name}`} />
      <div className="flex-1 space-y-8 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Role: {role?.name || 'Loading...'}</h1>
            <p className="text-base text-muted-foreground">
              Update the role details and permissions below
            </p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href={route('admin.roles.index')} className="flex items-center justify-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardHeader className="bg-gray-50 border-b">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold">Role Information</CardTitle>
                <CardDescription>
                  Update the role details and permissions
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Role Name *</Label>
                    <Input
                      id="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      placeholder="e.g., Administrator"
                      className="mt-1"
                      required
                    />
                  </div>
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="slug" className="text-sm font-medium text-gray-700">Slug *</Label>
                    <Input
                      id="slug"
                      value={data.slug}
                      onChange={(e) => setData('slug', e.target.value)}
                      placeholder="e.g., admin"
                      className="mt-1 font-mono text-sm"
                      required
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      A unique identifier for this role (lowercase, no spaces)
                    </p>
                  </div>
                  {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                    <Input
                      id="description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      placeholder="A brief description of this role"
                      className="mt-1"
                    />
                  </div>
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-3 pt-1">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={data.is_default}
                        onChange={(e) => setData('is_default', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                        Default Role
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        New users will be assigned this role by default
                      </p>
                    </div>
                  </div>
                  {errors.is_default && <p className="text-sm text-red-500 mt-1">{errors.is_default}</p>}
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Permissions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Select the permissions this role should have. Users with this role will inherit these permissions.
                  </p>
                  
                  {Object.keys(groupedPermissions).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
                        <div key={group} className="space-y-3">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {group.replace(/_/g, ' ')}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {groupPermissions.map((permission) => (
                              <div key={permission.id} className="flex items-start space-x-3">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={isPermissionChecked(permission.id)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.id, checked as boolean)
                                  }
                                />
                                <div className="space-y-1">
                                  <Label 
                                    htmlFor={`permission-${permission.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {permission.name}
                                  </Label>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No permissions available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            {/* Form actions */}
            <CardFooter className="bg-gray-50 border-t px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <div>
                  {role.created_at && (
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(role.created_at).toLocaleDateString()}
                      {role.updated_at && ` • Updated: ${new Date(role.updated_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button type="button" variant="outline" asChild>
                    <Link href={route('admin.roles.index')}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={processing} className="min-w-[120px]">
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        {/* Users assigned to this role */}
        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">Users with this Role</CardTitle>
              <CardDescription>
                {role.users.length > 0 
                  ? `There ${role.users.length === 1 ? 'is' : 'are'} ${role.users.length} user${role.users.length === 1 ? '' : 's'} assigned to this role`
                  : 'No users are currently assigned to this role'}
              </CardDescription>
            </div>
          </CardHeader>
            <CardContent className="p-0">
              {role.users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Member Since
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Current Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {role.users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.created_at}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {user.role ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {user.role.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                No Role
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="text-gray-400">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
                    <p className="mt-1 text-sm text-gray-500">No users are currently assigned to this role.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayoutWithSidebar>
  );
}
