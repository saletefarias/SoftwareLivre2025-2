import React from "react";

export interface TaskItemProps {
  time: string;
  title: string;
  done?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ time, title, done = false }) => {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked={done} className="h-4 w-4" />
      </label>
      <div className="flex-1">
        <div className="font-medium text-sm">{time} — {title}</div>
      </div>
    </div>
  );
};

export default TaskItem;
