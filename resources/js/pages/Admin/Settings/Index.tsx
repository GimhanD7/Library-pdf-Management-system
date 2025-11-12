import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Database, 
  Mail, 
  Server, 
  HardDrive, 
  Zap, 
  RefreshCw, 
  Link2, 
  Play,
  Info,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { type BreadcrumbItem } from '@/types';
import { useState, createContext, useContext } from 'react';

// Simple inline tabs components to avoid import issues
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
}>({
  activeTab: '',
  setActiveTab: () => {},
});

const Tabs = ({ defaultValue = '', children, className }: { defaultValue?: string; children: React.ReactNode; className?: string }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
    {children}
  </div>
);

const TabsTrigger = ({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-background text-foreground shadow-sm",
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) => {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) {
    return null;
  }
  
  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  );
};

type Settings = {
  app: {
    name: string;
    url: string;
    timezone: string;
    locale: string;
    debug: boolean;
    env: string;
  };
  database: {
    connection: string;
    host: string;
    port: string;
    database: string;
  };
  mail: {
    mailer: string;
    host: string;
    port: string;
    from_address: string;
    from_name: string;
  };
  cache: {
    default: string;
    prefix: string;
  };
  session: {
    driver: string;
    lifetime: string;
    secure: boolean;
    same_site: string;
  };
  storage: {
    default: string;
    public_disk: string;
    storage_link: boolean;
  };
};

type SystemInfo = {
  php_version: string;
  laravel_version: string;
  server_software: string;
  memory_limit: string;
  max_execution_time: string;
  upload_max_filesize: string;
  post_max_size: string;
  disk_usage: {
    free: string;
    total: string;
    used: string;
    percentage: number;
  };
};

type Props = {
  settings: Settings;
  systemInfo: SystemInfo;
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
    title: 'System Settings',
    href: '/admin/settings',
  },
];

export default function SettingsIndex({ settings, systemInfo, auth }: Props) {
  const pageProps = usePage().props as any;
  const can = pageProps?.auth?.can || {};
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const { data, setData, put, processing, errors } = useForm({
    app_name: settings.app.name,
    app_url: settings.app.url,
    timezone: settings.app.timezone,
    locale: settings.app.locale,
    mail_from_name: settings.mail.from_name,
    mail_from_address: settings.mail.from_address,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put('/admin/settings');
  };

  const handleAction = async (action: string, actionRoute: string) => {
    setIsLoading(action);
    try {
      window.location.href = actionRoute;
    } catch (error) {
      setIsLoading(null);
    }
  };

  const getStatusBadge = (status: boolean | string, trueLabel = 'Active', falseLabel = 'Inactive') => {
    const isActive = typeof status === 'boolean' ? status : status === 'true';
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? trueLabel : falseLabel}
      </Badge>
    );
  };

  const getEnvironmentBadge = (env: string) => {
    const variant = env === 'production' ? 'destructive' : env === 'staging' ? 'secondary' : 'default';
    return <Badge variant={variant}>{env.toUpperCase()}</Badge>;
  };

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title="System Settings" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground text-lg">
              Manage application configuration and system maintenance
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="mail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Mail
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>
                    Configure basic application settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="app_name">Application Name</Label>
                        <Input
                          id="app_name"
                          value={data.app_name}
                          onChange={(e) => setData('app_name', e.target.value)}
                        />
                        {errors.app_name && (
                          <p className="text-sm text-red-500">{errors.app_name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="app_url">Application URL</Label>
                        <Input
                          id="app_url"
                          value={data.app_url}
                          onChange={(e) => setData('app_url', e.target.value)}
                        />
                        {errors.app_url && (
                          <p className="text-sm text-red-500">{errors.app_url}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                          id="timezone"
                          value={data.timezone}
                          onChange={(e) => setData('timezone', e.target.value)}
                        />
                        {errors.timezone && (
                          <p className="text-sm text-red-500">{errors.timezone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="locale">Locale</Label>
                        <Input
                          id="locale"
                          value={data.locale}
                          onChange={(e) => setData('locale', e.target.value)}
                        />
                        {errors.locale && (
                          <p className="text-sm text-red-500">{errors.locale}</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Environment</Label>
                        <div>{getEnvironmentBadge(settings.app.env)}</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Debug Mode</Label>
                        <div>{getStatusBadge(settings.app.debug, 'Enabled', 'Disabled')}</div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={processing}>
                        {processing ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mail Settings</CardTitle>
                  <CardDescription>
                    Configure email settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mail_from_name">From Name</Label>
                      <Input
                        id="mail_from_name"
                        value={data.mail_from_name}
                        onChange={(e) => setData('mail_from_name', e.target.value)}
                      />
                      {errors.mail_from_name && (
                        <p className="text-sm text-red-500">{errors.mail_from_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mail_from_address">From Address</Label>
                      <Input
                        id="mail_from_address"
                        type="email"
                        value={data.mail_from_address}
                        onChange={(e) => setData('mail_from_address', e.target.value)}
                      />
                      {errors.mail_from_address && (
                        <p className="text-sm text-red-500">{errors.mail_from_address}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Configuration</CardTitle>
                <CardDescription>
                  Current database connection settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Connection</Label>
                      <p className="text-sm text-muted-foreground">{settings.database.connection}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Host</Label>
                      <p className="text-sm text-muted-foreground">{settings.database.host}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Port</Label>
                      <p className="text-sm text-muted-foreground">{settings.database.port}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Database</Label>
                      <p className="text-sm text-muted-foreground">{settings.database.database}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mail Settings */}
          <TabsContent value="mail">
            <Card>
              <CardHeader>
                <CardTitle>Mail Configuration</CardTitle>
                <CardDescription>
                  Current mail server settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Mailer</Label>
                      <p className="text-sm text-muted-foreground">{settings.mail.mailer}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Host</Label>
                      <p className="text-sm text-muted-foreground">{settings.mail.host}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Port</Label>
                      <p className="text-sm text-muted-foreground">{settings.mail.port}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">From Name</Label>
                      <p className="text-sm text-muted-foreground">{settings.mail.from_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">From Address</Label>
                      <p className="text-sm text-muted-foreground">{settings.mail.from_address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Info */}
          <TabsContent value="system">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>
                    Server and application details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">PHP Version</Label>
                        <p className="text-sm text-muted-foreground">{systemInfo.php_version}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Laravel Version</Label>
                        <p className="text-sm text-muted-foreground">{systemInfo.laravel_version}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Server Software</Label>
                        <p className="text-sm text-muted-foreground">{systemInfo.server_software}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Memory Limit</Label>
                        <p className="text-sm text-muted-foreground">{systemInfo.memory_limit}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Max Execution Time</Label>
                        <p className="text-sm text-muted-foreground">{systemInfo.max_execution_time}s</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Upload Max Filesize</Label>
                        <p className="text-sm text-muted-foreground">{systemInfo.upload_max_filesize}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Post Max Size</Label>
                        <p className="text-sm text-muted-foreground">{systemInfo.post_max_size}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Disk Usage</CardTitle>
                  <CardDescription>
                    Server disk space information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Used Space</span>
                      <span className="text-sm text-muted-foreground">
                        {systemInfo.disk_usage.used} / {systemInfo.disk_usage.total}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${systemInfo.disk_usage.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Free: {systemInfo.disk_usage.free}</span>
                      <span>{systemInfo.disk_usage.percentage}% used</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Maintenance */}
          <TabsContent value="maintenance">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Management</CardTitle>
                  <CardDescription>
                    Clear application caches and optimize performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleAction('clear-cache', '/admin/settings/clear-cache')}
                      disabled={isLoading === 'clear-cache'}
                      className="h-20 flex-col gap-2"
                    >
                      {isLoading === 'clear-cache' ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : (
                        <Trash2 className="h-6 w-6" />
                      )}
                      <span>Clear Cache</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleAction('optimize', '/admin/settings/optimize')}
                      disabled={isLoading === 'optimize'}
                      className="h-20 flex-col gap-2"
                    >
                      {isLoading === 'optimize' ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : (
                        <Zap className="h-6 w-6" />
                      )}
                      <span>Optimize App</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                  <CardDescription>
                    System maintenance and setup tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleAction('storage-link', '/admin/settings/storage-link')}
                      disabled={isLoading === 'storage-link' || settings.storage.storage_link}
                      className="h-20 flex-col gap-2"
                    >
                      {isLoading === 'storage-link' ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : settings.storage.storage_link ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <Link2 className="h-6 w-6" />
                      )}
                      <span>
                        {settings.storage.storage_link ? 'Storage Linked' : 'Create Storage Link'}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleAction('migrate', '/admin/settings/migrate')}
                      disabled={isLoading === 'migrate'}
                      className="h-20 flex-col gap-2"
                    >
                      {isLoading === 'migrate' ? (
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                      <span>Run Migrations</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutWithSidebar>
  );
}
