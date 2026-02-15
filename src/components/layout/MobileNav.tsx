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

export function MobileNav() {
    const location = useLocation();

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white md:hidden">
            <div className="flex justify-around">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                'flex flex-col items-center py-2 px-1 text-xs font-medium',
                                isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mb-1 h-6 w-6',
                                    isActive ? 'text-primary' : 'text-gray-400'
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
