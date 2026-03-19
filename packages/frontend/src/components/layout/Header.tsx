import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search tasks, projects, people... (Cmd+K)"
          className="pl-9 text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </div>
    </header>
  );
}
