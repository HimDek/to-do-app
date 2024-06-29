import React, { useState } from 'react';
import axios from 'axios';

const Task = ({ listId, taskId, taskName, taskCompleted, deleteTask }) => {
    const [taskCurrentName, setTaskName] = useState(taskName);
    const [taskCurrentCompleted, setTaskCompleted] = useState(taskCompleted);
    const [typingTimeout, setTypingTimeout] = useState(null);

    const handleTaskNameChange = (e) => {
        const value = e.target.value;
        setTaskName(value);

        // Clear the previous timeout to prevent premature execution
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        // Set a new timeout
        setTypingTimeout(setTimeout(() => {
            // Call your function here
            handleTaskNameTypingFinished(value);
        }, 500)); // Adjust the delay as needed (milliseconds)
    };

    const handleTaskNameTypingFinished = (value) => {
        renameTask(listId, taskId, value)
    };

    const renameTask = async (listId, taskId, name) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/lists/${listId}/tasks/${taskId}`, { name });
            setTaskName(name);
        } catch (error) {
            console.error('Error renaming Task:', error);
        }
    }

    const markComplete = async (listId, taskId) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/lists/${listId}/tasks/${taskId}/complete`);
            setTaskCompleted(true);
        } catch (error) {
            console.error('Error marking task complete:', error);
        }
    }

    const markIncomplete = async (listId, taskId) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/lists/${listId}/tasks/${taskId}/uncomplete`);
            setTaskCompleted(false);
        } catch (error) {
            console.error('Error marking task incomplete:', error);
        }
    }

    return (
        <li key={taskId} className="task d-flex align-items-center gap-2">
            <input
                className="check-input" 
                type="checkbox"
                checked={taskCurrentCompleted}
                onChange={() => taskCurrentCompleted ? markIncomplete(listId, taskId) : markComplete(listId, taskId)}
            />
            <input className={taskCurrentCompleted ? "input input-success fw-bold" : "input input-danger fw-bold"} type="text" placeholder="Task" value={taskCurrentName} onChange={handleTaskNameChange} />
            <button className="btn btn-danger" onClick={() => deleteTask(listId, taskId)}>Delete</button>
        </li>
    );
};

export default Task;
