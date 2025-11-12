import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Menu, Newspaper, X, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Publications',
        href: '/publications',
        icon: Newspaper,
    },
    {
        title: 'Users',
        href: '/admin/dashboard',
        icon: Users,
    },
];

const footerNavItems: NavItem[] = [

];

interface PageProps extends SharedData {
    // Add any additional page props here if needed
}

export function AppSidebar() {
    const { props } = usePage<PageProps>();
    const [isOpen, setIsOpen] = useState(props.sidebarOpen ?? true);
    
    // Sync local state with server state when props change
    useEffect(() => {
        setIsOpen(props.sidebarOpen ?? true);
    }, [props.sidebarOpen]);
    
    // Filter navigation items based on user role
    const filteredNavItems = mainNavItems.filter(item => {
        // Show Users menu only to admin and librarian roles
        if (item.title === 'Users') {
            const userRole = props.auth?.user?.role?.slug?.toLowerCase();
            return userRole === 'admin' || userRole === 'librarian';
        }
        return true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center justify-between">
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                        
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}