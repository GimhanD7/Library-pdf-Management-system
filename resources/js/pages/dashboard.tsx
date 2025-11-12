import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BarChart3, FileText, Users, Clock, ArrowUpRight, TrendingUp, Activity, Calendar, FileCheck, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    registerables
} from 'chart.js';

// Register required ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Type definitions
interface StatItem {
    title: string;
    value: string | number;
    icon: any;
    trend: string;
    trendDirection: 'up' | 'down' | 'stable';
}

interface ActivityItem {
    id: number;
    title: string;
    time: string;
    icon: any;
}

interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    tension: number;
    fill: boolean;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointHoverRadius: number;
    pointHoverBackgroundColor: string;
    pointHoverBorderColor: string;
    pointHitRadius: number;
    pointBorderWidth: number;
    yAxisID: string;
}

interface ChartDataState {
    labels: string[];
    datasets: ChartDataset[];
}

export default function Dashboard() {
    const [stats, setStats] = useState<StatItem[]>([]);
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<ChartDataState>({
        labels: [],
        datasets: []
    });
    
    // Calculate percentage change between current and previous period
    const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };
    
    // Get active users percentage change (example: current month vs previous month)
    const activeUsersChange = stats[2]?.value 
        ? calculatePercentageChange(
            parseInt(stats[2].value.toString().replace(/,/g, '')), 
            Math.max(1, parseInt(stats[2].value.toString().replace(/,/g, '')) - 10) // Example: using -10 for demo
        )
        : 0;

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/dashboard/statistics');
                const { stats: statsData, recent_activity: activityData } = response.data;
                console.log('API Response:', response.data);

                // Update chart data if monthly data exists
                if (statsData.monthly_data) {
                    const { months, publications, users } = statsData.monthly_data;
                    console.log('Chart Data - Months:', months);
                    console.log('Chart Data - Publications:', publications);
                    console.log('Chart Data - Users:', users);
                    
                    if (months && months.length > 0) {
                        const chartConfig: ChartDataState = {
                            labels: months,
                            datasets: [
                                {
                                    label: 'Publications',
                                    data: publications.map(Number),
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    borderColor: '#3b82f6',
                                    borderWidth: 3,
                                    tension: 0.4,
                                    fill: false,
                                    pointBackgroundColor: '#3b82f6',
                                    pointBorderColor: '#ffffff',
                                    pointHoverRadius: 6,
                                    pointHoverBackgroundColor: '#3b82f6',
                                    pointHoverBorderColor: '#ffffff',
                                    pointHitRadius: 10,
                                    pointBorderWidth: 2,
                                    yAxisID: 'y',
                                },
                                {
                                    label: 'New Users',
                                    data: users.map(Number),
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderColor: '#10b981',
                                    borderWidth: 3,
                                    tension: 0.4,
                                    fill: false,
                                    pointBackgroundColor: '#10b981',
                                    pointBorderColor: '#ffffff',
                                    pointHoverRadius: 6,
                                    pointHoverBackgroundColor: '#10b981',
                                    pointHoverBorderColor: '#ffffff',
                                    pointHitRadius: 10,
                                    pointBorderWidth: 2,
                                    yAxisID: 'y1',
                                },
                            ],
                        };
                        console.log('Chart Config:', chartConfig);
                        setChartData(chartConfig);
                    } else {
                        console.error('No valid months data received');
                    }
                }

                // Update stats
                setStats([
                    { 
                        title: 'Total Publications', 
                        value: statsData.total_publications.toLocaleString(), 
                        icon: FileText,
                        trend: `${statsData.publications_this_month > 0 ? '+' : ''}${statsData.publications_this_month} this month`,
                        trendDirection: statsData.publications_this_month > 0 ? 'up' : 'stable'
                    },
                    { 
                        title: 'This Month', 
                        value: statsData.publications_this_month, 
                        icon: Calendar,
                        trend: 'New publications',
                        trendDirection: 'up' 
                    },
                    { 
                        title: 'Total Users', 
                        value: statsData.total_users.toLocaleString(),
                        icon: Users,
                        trend: 'Registered users',
                        trendDirection: 'stable' 
                    },
                    { 
                        title: 'Pending', 
                        value: '0', // This would come from your database if you have a status field
                        icon: FileCheck,
                        trend: 'Awaiting review',
                        trendDirection: 'stable' 
                    },
                ]);

                // Update recent activity
                if (activityData && activityData.length > 0) {
                    const formattedActivity = activityData.map((activity: any) => ({
                        id: activity.id,
                        title: activity.title,
                        time: activity.time,
                        icon: activity.icon === 'users' ? Users : FileText
                    }));
                    setRecentActivity(formattedActivity);
                }

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const generateReport = async () => {
        try {
            setReportLoading(true);
            
            // Create a temporary link to trigger download
            const link = document.createElement('a');
            link.href = '/reports/generate';
            link.download = `library-report-${new Date().toISOString().split('T')[0]}.pdf`;
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            toast.success('Report generated successfully! Check your downloads folder.');
            
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report. Please try again.');
        } finally {
            // Reset loading state after a short delay to show feedback
            setTimeout(() => {
                setReportLoading(false);
            }, 2000);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex-1 space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back! Here's what's happening with your library.</p>
                    </div>
                    <Button 
                        onClick={() => generateReport()}
                        disabled={reportLoading}
                    >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {reportLoading ? 'Generating PDF...' : 'Generate Report'}
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 4 }).map((_, index) => (
                            <Card key={index} className="animate-pulse">
                                <CardHeader className="pb-2">
                                    <div className="h-4 w-24 bg-muted rounded"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-8 w-16 bg-muted rounded"></div>
                                    <div className="h-3 w-24 bg-muted rounded mt-2"></div>
                                </CardContent>
                            </Card>
                        ))
                    ) : error ? (
                        <div className="col-span-4 text-center py-8">
                            <p className="text-destructive">{error}</p>
                            <Button 
                                variant="outline" 
                                className="mt-4"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </div>
                    ) : (
                        stats.map((stat, index) => (
                            <Card key={index} className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    {stat.trend && (
                                        <p className={`text-xs ${stat.trendDirection === 'up' ? 'text-green-500' : stat.trendDirection === 'down' ? 'text-red-500' : 'text-muted-foreground'} mt-1 flex items-center`}>
                                            {stat.trendDirection === 'up' ? (
                                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                            ) : stat.trendDirection === 'down' ? (
                                                <ArrowUpRight className="h-3 w-3 mr-1 transform rotate-90" />
                                            ) : null}
                                            {stat.trend}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Main Chart */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <CardTitle>Overview</CardTitle>
                                    <CardDescription>Monthly statistics for publications and users</CardDescription>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex items-center">
                                        <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
                                        <span className="text-xs text-muted-foreground">Publications</span>
                                    </div>
                                    <div className="flex items-center ml-4">
                                        <div className="w-3 h-0.5 bg-green-500 mr-2"></div>
                                        <span className="text-xs text-muted-foreground">New Users</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] relative">
                                {chartData?.labels?.length > 0 ? (
                                    <Line
                                        data={chartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            interaction: {
                                                mode: 'index',
                                                intersect: false,
                                            },
                                            plugins: {
                                                legend: {
                                                    display: false,
                                                },
                                                tooltip: {
                                                    backgroundColor: 'white',
                                                    titleColor: '#1f2937',
                                                    bodyColor: '#1f2937',
                                                    borderColor: '#e5e7eb',
                                                    borderWidth: 1,
                                                    padding: 12,
                                                    displayColors: true,
                                                    usePointStyle: true,
                                                    callbacks: {
                                                        label: function(context) {
                                                            const label = context.dataset?.label || '';
                                                            const value = context.parsed?.y ?? 0;
                                                            return `${label}: ${value}`;
                                                        }
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    type: 'linear',
                                                    display: true,
                                                    position: 'left',
                                                    title: {
                                                        display: true,
                                                        text: 'Publications'
                                                    },
                                                    grid: {
                                                        display: true,
                                                        drawOnChartArea: true,
                                                        drawTicks: false,
                                                    },
                                                    ticks: {
                                                        stepSize: 1,
                                                        precision: 0,
                                                    }
                                                },
                                                y1: {
                                                    type: 'linear',
                                                    display: true,
                                                    position: 'right',
                                                    title: {
                                                        display: true,
                                                        text: 'New Users'
                                                    },
                                                    grid: {
                                                        drawOnChartArea: false,
                                                    },
                                                    ticks: {
                                                        stepSize: 1,
                                                        precision: 0,
                                                    }
                                                },
                                                x: {
                                                    grid: {
                                                        display: false,
                                                    },
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-muted/50 rounded-lg">
                                        <div className="text-center p-6">
                                            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-medium mb-1">Publication Analytics</h3>
                                            <p className="text-sm text-muted-foreground">Loading publication statistics...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest actions in your library</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {loading ? (
                                    // Loading skeleton for recent activity
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted"></div>
                                            <div className="ml-4 space-y-2 flex-1">
                                                <div className="h-4 w-3/4 bg-muted rounded"></div>
                                                <div className="h-3 w-1/2 bg-muted rounded"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : error ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-muted-foreground">Unable to load recent activity</p>
                                    </div>
                                ) : recentActivity.length > 0 ? (
                                    recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-start">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <activity.icon className="h-5 w-5" />
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">{activity.title}</p>
                                                <p className="text-sm text-muted-foreground flex items-center">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {activity.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-muted-foreground">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold flex items-center">
                                    <Activity className="h-5 w-5 mr-2 text-primary" />
                                    Quick Stats
                                </CardTitle>
                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Live</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                                    <div className="flex items-baseline">
                                        <span className="text-2xl font-bold">{stats[2]?.value || '0'}</span>
                                        {activeUsersChange !== 0 && (
                                            <span className={`ml-1 text-xs ${activeUsersChange >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                                {activeUsersChange >= 0 ? (
                                                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                                ) : (
                                                    <ArrowUpRight className="h-3 w-3 mr-0.5 transform rotate-90" />
                                                )}
                                                {Math.abs(activeUsersChange)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Avg. Session</p>
                                    <div className="flex items-baseline">
                                        <span className="text-2xl font-bold">4.2</span>
                                        <span className="ml-1 text-xs text-muted-foreground">min</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-border/50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">This Week</span>
                                    <div className="flex items-center">
                                        <span className="font-medium">1,234</span>
                                        <span className="ml-1 text-green-500 text-xs flex items-center">
                                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                            8.2%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-background">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Need Help?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Check out our documentation or contact support.</p>
                            <Button variant="outline" size="sm">Get Help</Button>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardHeader>
                            <CardTitle>Upgrade Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Unlock more features with our premium plan.</p>
                            <Button size="sm">Upgrade Now</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
