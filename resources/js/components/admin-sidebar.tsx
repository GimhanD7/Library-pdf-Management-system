import { NavFooter } from '@/components/nav-footer';
import { NavGrouped } from '@/components/nav-grouped';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users, UserCheck, Settings, Shield, Home, Lock, FileCheck, History, Gauge, ShieldCheck, BookText, Cog, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const adminNavGroups: NavGroup[] = [
    {
        title: 'Overview',
        icon: Gauge,
        defaultOpen: false,
        items: [
            {
                title: 'Admin Dashboard',
                href: '/admin/dashboard',
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'User & Access Management',
        icon: ShieldCheck,
        defaultOpen: false,
        items: [
            {
                title: 'User Management',
                href: '/admin/users',
                icon: Users,
            },
            {
                title: 'Role Management',
                href: '/admin/roles',
                icon: UserCheck,
            },
            {
                title: 'Permissions',
                href: '/admin/permissions',
                icon: Lock,
            },
        ],
    },
    {
        title: 'Publication Management',
        icon: BookText,
        defaultOpen: false,
        items: [
            {
                title: 'Pending Verification',
                href: '/admin/publications/pending',
                icon: FileCheck,
            },
            {
                title: 'Verification History',
                href: '/admin/publications/history',
                icon: History,
            },
            {
                title: 'Deleted Publications',
                href: '/admin/publications/deleted',
                icon: Trash2,
            },
        ],
    },
    {
        title: 'System',
        icon: Cog,
        defaultOpen: false,
        items: [
            {
                title: 'System Settings',
                href: '/admin/settings',
                icon: Settings,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Back to Main Dashboard',
        href: '/dashboard',
        icon: Home,
    },
];

interface PageProps extends SharedData {
    // Add any additional page props here if needed
}

export function AdminSidebar() {
    const { props } = usePage<PageProps>();
    const [isOpen, setIsOpen] = useState(props.sidebarOpen ?? true);
    
    // Sync local state with server state when props change
    useEffect(() => {
        setIsOpen(props.sidebarOpen ?? true);
    }, [props.sidebarOpen]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Shield className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Admin Panel</span>
                                    <span className="truncate text-xs">Management Interface</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavGrouped groups={adminNavGroups} />
                <NavFooter items={footerNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
