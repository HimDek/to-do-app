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
        <form onSubmit={handleSubmit} className="d-flex align-items-center gap-2">
            <input
                className="input input-accent lead"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter new list name"
            />
            <button className="btn btn-accent lead" type="submit">Create List</button>
        </form>
    );
};

export default ListForm;
