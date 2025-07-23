import React, { useState, useEffect } from 'react';
import ImprovedDailyPlanner from './ImprovedDailyPlanner';
import { useLocalTaskService } from '../services/localTaskService';

const MobileCalendarTestPage = () => {
  const {
    todayTasks,
    dailyTaskPool,
    scheduledTasks,
    goals,
    completedTasks,
    saveTaskData,
    loadTaskData
  } = useLocalTaskService();

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadTaskData();
  }, []);

  const handleTaskUpdate = (updatedTasks) => {
    saveTaskData({
      todayTasks,
      dailyTaskPool: updatedTasks,
      scheduledTasks,
      goals,
      completedTasks
    });
  };

  const handleScheduledTaskUpdate = (updatedScheduledTasks) => {
    saveTaskData({
      todayTasks,
      dailyTaskPool,
      scheduledTasks: updatedScheduledTasks,
      goals,
      completedTasks
    });
  };

  return (
    <div className="w-full h-screen">
      <ImprovedDailyPlanner
        dailyTaskPool={dailyTaskPool}
        onTaskUpdate={handleTaskUpdate}
        scheduledTasks={scheduledTasks}
        onScheduledTaskUpdate={handleScheduledTaskUpdate}
        selectedDate={selectedDate}
        overdueTasks={[]}
      />
    </div>
  );
};

export default MobileCalendarTestPage;