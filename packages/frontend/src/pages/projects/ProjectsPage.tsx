import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectCardProps {
  name: string;
  description: string;
  color: string;
  tasksCount: number;
  membersCount: number;
}

function ProjectCard({ name, description, color, tasksCount, membersCount }: ProjectCardProps) {
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: color }} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{description}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span>{tasksCount} tasks</span>
              <span>{membersCount} members</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const sampleProjects = [
  {
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX.',
    color: '#6366f1',
    tasksCount: 24,
    membersCount: 5,
  },
  {
    name: 'Mobile App v2',
    description: 'Second version of our mobile application with new features and performance improvements.',
    color: '#22c55e',
    tasksCount: 18,
    membersCount: 4,
  },
  {
    name: 'Marketing Campaign',
    description: 'Q1 marketing campaign across social media and email channels.',
    color: '#f59e0b',
    tasksCount: 12,
    membersCount: 3,
  },
];

export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track all your projects</p>
        </div>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sampleProjects.map((project) => (
          <ProjectCard key={project.name} {...project} />
        ))}
      </div>
    </div>
  );
}
