// Tasks.js
import React, { useState } from 'react';
import axios from 'axios';
import TaskForm from './TaskForm';
import Task from './Task';

const Tasks = ({ listId, tasks }) => {
    const [currentTasks, setTasks] = useState(tasks);


    const addTask = async (listId, taskData) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/lists/${listId}/tasks`, taskData);
            setTasks([...currentTasks, response.data]);
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }

    const deleteTask = async (listId, taskId) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/lists/${listId}/tasks/${taskId}`);
            setTasks(currentTasks.filter(task => task.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    return (
        <div>
            <ul>
                {currentTasks.map(task => (
                    <Task key={task.id} listId={listId} taskId={task.id} taskName={task.name} taskCompleted={task.completed} deleteTask={deleteTask} />
                ))}
            </ul>
            <TaskForm listId={listId} addTask={addTask} />
        </div>
    );
};

export default Tasks;
