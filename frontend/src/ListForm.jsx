// ListForm.js
import React, { useState } from 'react';

const ListForm = ({ createList }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            createList({
                id: new Date().getTime(),
                name: name,
                tasks: []
            });
            setName('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="create-list d-flex align-items-center">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter list name"
            />
            <button className="btn" type="submit">Create List</button>
        </form>
    );
};

export default ListForm;
