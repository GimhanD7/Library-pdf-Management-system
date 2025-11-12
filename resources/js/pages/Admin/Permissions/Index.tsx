import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Settings, Eye, Plus, BookOpen } from 'lucide-react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { type BreadcrumbItem } from '@/types';

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
  users_count: number;
  permissions: number[];
};

type Props = {
  permissions: Record<string, Permission[]>;
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
    title: 'Permissions',
    href: '/admin/permissions',
  },
];

const getGroupIcon = (group: string) => {
  switch (group) {
    case 'user_management':
      return <Users className="h-5 w-5" />;
    case 'role_management':
      return <Shield className="h-5 w-5" />;
    case 'publication_management':
      return <BookOpen className="h-5 w-5" />;
    case 'settings':
      return <Settings className="h-5 w-5" />;
    default:
      return <Eye className="h-5 w-5" />;
  }
};

const getGroupColor = (group: string) => {
  switch (group) {
    case 'user_management':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'role_management':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'publication_management':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'settings':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatGroupName = (group: string) => {
  return group.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function PermissionsIndex({ permissions, roles, auth }: Props) {
  const pageProps = usePage().props as any;
  const can = pageProps?.auth?.can || {};

  const getRolePermissionCount = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.permissions.length : 0;
  };

  const hasPermission = (roleId: number, permissionId: number) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.permissions.includes(permissionId) : false;
  };

  const totalPermissions = Object.values(permissions).flat().length;
  const totalGroups = Object.keys(permissions).length;

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title="Permissions" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Permissions Overview</h1>
            <p className="text-muted-foreground text-lg">
              Manage system permissions and role assignments
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPermissions}</div>
              <p className="text-xs text-muted-foreground">
                Across {totalGroups} categories
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">
                {roles.filter(r => r.is_default).length} default role(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permission Groups</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                Organized categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roles.reduce((sum, role) => sum + role.users_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all roles
              </p>
            </CardContent>
          </Card>
        </div>



        {/* Role Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permission Matrix</CardTitle>
            <CardDescription>
              Overview of which roles have which permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Role</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Permissions</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    {can?.edit_roles && (
                      <TableHead className="text-center">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {role.users_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {role.permissions.length} / {totalPermissions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {role.is_default ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            Default
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Optional
                          </Badge>
                        )}
                      </TableCell>
                      {can?.edit_roles && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={route('admin.roles.edit', role.id)}>
                              Edit
                            </Link>
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Permissions by Group */}
        <div className="grid gap-6">
          {Object.entries(permissions).map(([group, groupPermissions]) => (
            <Card key={group}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  {getGroupIcon(group)}
                  <CardTitle className="text-xl">{formatGroupName(group)}</CardTitle>
                </div>
                <CardDescription>
                  {groupPermissions.length} permission{groupPermissions.length !== 1 ? 's' : ''} in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupPermissions.map((permission) => (
                    <div 
                      key={permission.id} 
                      className={`p-4 rounded-lg border ${getGroupColor(group)}`}
                    >
                      <div className="space-y-2">
                        <h4 className="font-medium">{permission.name}</h4>
                        {permission.description && (
                          <p className="text-sm opacity-80">
                            {permission.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {roles
                            .filter(role => hasPermission(role.id, permission.id))
                            .map(role => (
                              <Badge 
                                key={role.id} 
                                variant="secondary" 
                                className="text-xs"
                              >
                                {role.name}
                              </Badge>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        
      </div>
    </AdminLayoutWithSidebar>
  );
}
