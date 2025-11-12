import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayoutWithSidebar from '@/layouts/AdminLayoutWithSidebar';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Download, Filter, X, Search, Eye } from 'lucide-react';
import { ArrowLeft, Users, BookOpen, CheckCircle, Clock, AlertCircle, Activity, BookMarked } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Activity item type with extended details
type ActivityItem = {
  id: string;
  type: 'user' | 'publication' | 'system';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  details?: Record<string, string>;
};

type ActivitiesProps = {
  activities: ActivityItem[];
  filters: {
    search?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
  };
  activityTypes: Array<{
    value: string;
    label: string;
  }>;
  pagination: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
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
} as const;

export default function ActivitiesIndex({ activities, filters, activityTypes, pagination }: ActivitiesProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { data, setData, get } = useForm({
    search: filters.search || '',
    type: filters.type || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      get(route('admin.activities.index'), {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [data.search]);

  const handleFilter = () => {
    get(route('admin.activities.index', data), {
      preserveState: true,
      preserveScroll: true,
    });
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setData({
      search: '',
      type: '',
      date_from: '',
      date_to: '',
    });
    get(route('admin.activities.index'), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const exportCsv = () => {
    window.location.href = route('admin.activities.export.csv', data);
  };

  const exportPdf = () => {
    window.location.href = route('admin.activities.export.pdf', data);
  };

  const hasFilters = data.search || data.type || data.date_from || data.date_to;
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Activities', href: '/admin/activities' },
  ];

  // Get the icon component from the icon name
  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Activity;
  };

  return (
    <AdminLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <Head title="Activities" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
            <p className="text-muted-foreground">
              View all system activities and events
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportPdf}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Activities</CardTitle>
                <CardDescription>
                  {pagination.total} activities found
                  {hasFilters && (
                    <span className="ml-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={clearFilters}
                      >
                        Clear filters
                        <X className="ml-1 h-3 w-3" />
                      </Button>
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search activities..."
                    className="w-full pl-8 sm:w-[200px] md:w-[250px]"
                    value={data.search}
                    onChange={(e) => setData('search', e.target.value)}
                  />
                </div>
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                      {hasFilters && (
                        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                          {Object.values(data).filter(Boolean).length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Activity Type</label>
                        <Select 
                          value={data.type} 
                          onValueChange={(value) => setData('type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Types</SelectItem>
                            {activityTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !data.date_from && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {data.date_from ? format(new Date(data.date_from), 'PPP') : 'From'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={data.date_from ? new Date(data.date_from) : undefined}
                                onSelect={(date: Date | undefined) => {
                                  if (date && isValid(date)) {
                                    setData('date_from', format(date, 'yyyy-MM-dd'));
                                  } else {
                                    setData('date_from', '');
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !data.date_to && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {data.date_to ? format(new Date(data.date_to), 'PPP') : 'To'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={data.date_to ? new Date(data.date_to) : undefined}
                                onSelect={(date: Date | undefined) => {
                                  if (date && isValid(date)) {
                                    setData('date_to', format(date, 'yyyy-MM-dd'));
                                  } else {
                                    setData('date_to', '');
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button variant="outline" onClick={clearFilters}>
                          Clear
                        </Button>
                        <Button onClick={handleFilter}>Apply</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-6">
                {activities.map((activity) => {
                  const IconComponent = getIconComponent(activity.icon);
                  const activityDate = new Date(activity.timestamp);
                  
                  return (
                    <div 
                      key={activity.id} 
                      className="flex items-start space-x-4 group p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <div className="relative">
                        {activity.user?.avatar ? (
                          <img 
                            src={activity.user.avatar} 
                            alt={activity.user.name} 
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <IconComponent className="h-4 w-4" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background border-2 border-background">
                          <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
                            <IconComponent className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {activity.user?.name || 'System'}
                            <span className="text-muted-foreground ml-1.5">
                              {activity.title.toLowerCase()}
                            </span>
                          </p>
                          <time 
                            className="text-xs text-muted-foreground whitespace-nowrap ml-2"
                            dateTime={activity.timestamp}
                            title={format(activityDate, 'PPpp')}
                          >
                            {format(activityDate, 'MMM d, yyyy h:mm a')}
                          </time>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type}
                          </Badge>
                          {activity.details && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 px-2 text-xs text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActivity(activity);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No activities found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Activities will appear here when they occur.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Details Modal */}
        <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
          <DialogContent className="sm:max-w-[500px]">
            {selectedActivity && (
              <>
                <DialogHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {(() => {
                        const Icon = getIconComponent(selectedActivity.icon);
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div>
                      <DialogTitle>{selectedActivity.title}</DialogTitle>
                      <DialogDescription className="flex items-center">
                        {format(new Date(selectedActivity.timestamp), 'PPpp')}
                        <span className="mx-2">•</span>
                        <span className="capitalize">{selectedActivity.type}</span>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm">{selectedActivity.description}</p>
                  </div>
                  
                  {selectedActivity.user && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">User</h4>
                      <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                        {selectedActivity.user.avatar ? (
                          <img 
                            src={selectedActivity.user.avatar} 
                            alt={selectedActivity.user.name} 
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{selectedActivity.user.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedActivity.user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedActivity.details && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Details</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedActivity.details).map(([key, value]) => (
                          <div key={key} className="flex text-sm">
                            <span className="w-32 font-medium text-muted-foreground">{key}</span>
                            <span className="flex-1">{value || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayoutWithSidebar>
  );
}
