import { LayoutDashboard, ArrowRightLeft, PieChart, Wallet, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Budgets', href: '/budgets', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <div className="hidden md:flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center px-6 border-b border-gray-100">
                <span className="text-xl font-bold text-primary">FinanceTracker</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary-50 text-primary'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0',
                                    isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold">
                        U
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">User</p>
                        <p className="text-xs text-gray-500">user@example.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
