// TaskForm.js
import React, { useState } from 'react';

const TaskForm = ({ listId, addTask }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            addTask(
                listId,
                {
                    id: new Date().getTime(),
                    name: name,
                    completed: false
                }
            );
            setName('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="create-task d-flex align-items-center">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New Task"
            />
            <button className="btn" type="submit">Add Task</button>
        </form>
    );
};

export default TaskForm;
