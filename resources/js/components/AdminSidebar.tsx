// import React from 'react';
// import { Link } from '@inertiajs/react';
// import { LayoutDashboard, Users, BookOpen, FileText, Settings, Shield } from 'lucide-react';
// import { cn } from '@/lib/utils';

// export default function AdminSidebar() {
//     const navigation = [
//         { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, current: route().current('admin.dashboard') },
//         { name: 'Users', href: '/admin/users', icon: Users, current: route().current('admin.users.*') },
//         { name: 'Roles', href: route('admin.roles.index'), icon: Shield, current: route().current('admin.roles.*') },
//         { name: 'Publications', href: '/admin/publications', icon: BookOpen, current: route().current('admin.publications.*') },
//         { name: 'Reports', href: '/admin/reports', icon: FileText, current: route().current('admin.reports.*') },
//         { name: 'Settings', href: '/admin/settings', icon: Settings, current: route().current('admin.settings') },
//     ];

//     return (
//         <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r">
//             <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
//                 <div className="flex items-center flex-shrink-0 px-4">
//                     <Link href="/" className="flex items-center">
//                         <span className="text-xl font-bold text-primary">Library Admin</span>
//                     </Link>
//                 </div>
//                 <div className="mt-5 flex-1 flex flex-col">
//                     <nav className="flex-1 px-2 space-y-1">
//                         {navigation.map((item) => (
//                             <Link
//                                 key={item.name}
//                                 href={item.href}
//                                 className={cn(
//                                     item.current
//                                         ? 'bg-accent text-accent-foreground'
//                                         : 'text-foreground hover:bg-accent hover:text-accent-foreground',
//                                     'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
//                                 )}
//                             >
//                                 <item.icon
//                                     className={cn(
//                                         item.current ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
//                                         'mr-3 flex-shrink-0 h-5 w-5'
//                                     )}
//                                     aria-hidden="true"
//                                 />
//                                 {item.name}
//                             </Link>
//                         ))}
//                     </nav>
//                 </div>
//                 <div className="p-4 border-t">
//                     <div className="flex items-center
//                     ">
//                         <div className="ml-3">
//                             <p className="text-sm font-medium text-foreground">Admin User</p>
//                             <Link 
//                                 href="/admin/profile" 
//                                 className="text-xs font-medium text-muted-foreground hover:text-foreground"
//                             >
//                                 View profile
//                             </Link>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
