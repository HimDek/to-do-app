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
        <form onSubmit={handleSubmit} className="d-flex align-items-center gap-2">
            <input
                className="input input-accent"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New Task"
            />
            <button className="btn btn-accent" type="submit">Add Task</button>
        </form>
    );
};

export default TaskForm;
