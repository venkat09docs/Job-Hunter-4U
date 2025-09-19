import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export const TestButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border border-red-500 bg-red-50">
      <h3 className="text-red-800 font-bold mb-2">TEST BUTTON</h3>
      <Button
        onClick={() => {
          console.log('🧪 TEST BUTTON CLICKED!');
          navigate('/course/3656d01b-f153-4480-8c69-28155b271077');
        }}
        className="bg-red-500 hover:bg-red-600"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        TEST Navigate to Course
      </Button>
    </div>
  );
};