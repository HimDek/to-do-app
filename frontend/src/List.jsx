// Lists.js
import React, { useState } from 'react';
import axios from 'axios';
import Tasks from './Tasks';

const List = ({ listId, listName, tasks, deleteList }) => {
    const [listCurrentName, setListName] = useState(listName);
    const [typingTimeout, setTypingTimeout] = useState(null);

    const handleListNameChange = (e) => {
        const value = e.target.value;
        setListName(value);

        // Clear the previous timeout to prevent premature execution
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        // Set a new timeout
        setTypingTimeout(setTimeout(() => {
            // Call your function here
            handleListNameTypingFinished(value);
        }, 500)); // Adjust the delay as needed (milliseconds)
    };

    const handleListNameTypingFinished = (value) => {
        renameList(listId, value)
    };

    const renameList = async (listId, name) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/lists/${listId}`, { name });
            setListName(name);
        } catch (error) {
            console.error('Error renaming list:', error);
        }
    }

    return (
        <li key={listId} className="list">
            <div className="list-name d-flex align-items-center">
                <input type="text" placeholder="Enter list name" value={listCurrentName} onChange={handleListNameChange} />
                <button className="btn btn-danger" onClick={() => deleteList(listId)}>Delete</button>
            </div>
            <Tasks listId={listId} tasks={tasks} />
        </li>
    );
};

export default List;
