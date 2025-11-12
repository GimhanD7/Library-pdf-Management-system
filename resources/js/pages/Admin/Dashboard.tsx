import { Head, Link } from '@inertiajs/react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen, BookMarked, Activity, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

type StatCard = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
};

type ActivityItem = {
  id: string;
  type: 'user' | 'publication' | 'system';
  title: string;
  description: string;
  timestamp: string; // ISO string from backend
  icon: string; // Icon name as string from backend
};

type DashboardStats = {
  total_users: number;
  total_publications: number;
  total_roles: number;
  system_status: 'active' | 'maintenance' | 'degraded';
  user_growth?: number;
};

type DashboardProps = {
  stats: DashboardStats;
  recentActivities: ActivityItem[];
};

// Icon mapping from string to component
const iconMap = {
  Users: Users,
  BookOpen: BookOpen,
  CheckCircle: CheckCircle,
  Clock: Clock,
  AlertCircle: AlertCircle,
  Activity: Activity,
  BookMarked: BookMarked,
};

const getStatusBadgeVariant = (status: DashboardStats['system_status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    case 'degraded':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function Dashboard({ stats, recentActivities = [] }: DashboardProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Dashboard', href: '/admin/dashboard' },
  ];

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      value: stats.total_users.toLocaleString(),
      icon: Users,
      description: 'Registered users in the system',
      trend: stats.user_growth ? {
        value: `${stats.user_growth > 0 ? '+' : ''}${stats.user_growth}%`,
        isPositive: stats.user_growth >= 0,
      } : undefined,
    },
    {
      title: 'Publications',
      value: stats.total_publications.toLocaleString(),
      icon: BookOpen,
      description: 'Total publications in the library',
    },
    {
      title: 'User Roles',
      value: stats.total_roles,
      icon: Users,
      description: 'Different user roles',
    },
    {
      title: 'System Status',
      value: stats.system_status.charAt(0).toUpperCase() + stats.system_status.slice(1),
      icon: Activity,
      description: 'Current system status',
    },
  ];

  // Get the icon component from the icon name
  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Activity;
  };

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title="Admin Dashboard" />
      
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your library management system
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  {stat.trend && (
                    <span className={`text-xs ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.value}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Activity */}
          <Card className="col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-primary">
                  <Link href={route('admin.activities.index')}>
                    View All
                  </Link>
                </Button>
              </div>
              <CardDescription>Latest activities in your system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const IconComponent = getIconComponent(activity.icon);
                    return (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No recent activities found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>API Status</span>
                  </div>
                  <Badge variant="outline" className={getStatusBadgeVariant('active')}>
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Database</span>
                  </div>
                  <Badge variant="outline" className={getStatusBadgeVariant('active')}>
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span>Last Backup</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 60 * 12), { addSuffix: true })}
                  </span>
                </div>
                <div className="pt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    <Activity className="mr-2 h-4 w-4" />
                    Run System Check
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}
