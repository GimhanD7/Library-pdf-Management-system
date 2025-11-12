import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
    SidebarGroup, 
    SidebarGroupLabel, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem, 
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export function NavGrouped({ groups = [] }: { groups: NavGroup[] }) {
    const page = usePage();
    
    return (
        <>
            {groups.map((group) => (
                <Collapsible
                    key={group.title}
                    defaultOpen={group.defaultOpen ?? true}
                    className="group/collapsible"
                >
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 py-1.5 text-sm font-medium transition-colors">
                                <span className="flex items-center gap-2">
                                    {group.icon && <group.icon className="size-4" />}
                                    <span>{group.title}</span>
                                </span>
                                <ChevronRight className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton 
                                            asChild 
                                            isActive={page.url.startsWith(item.href)} 
                                            tooltip={{ children: item.title }}
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            ))}
        </>
    );
}
