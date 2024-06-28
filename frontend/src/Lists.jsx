// Lists.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ListForm from './ListForm';
import List from './List';

const Lists = () => {
    const [lists, setLists] = useState([]);

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/lists`);
            setLists(response.data);
        } catch (error) {
            console.error('Error fetching lists:', error);
        }
    };

    const createList = async (listData) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/lists`, listData);
            setLists([...lists, response.data]);
        } catch (error) {
            console.error('Error creating list:', error);
        }
    };

    const deleteList = async (listId) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/lists/${listId}`);
            setLists(lists.filter(list => list.id !== listId));
        } catch (error) {
            console.error('Error deleting list:', error);
        }
    }

    return (
        <div>
            <h1>To Do Lists</h1>
            <ListForm createList={createList} />
            <ul>
                {lists.map(list => (
                    <List key={list.id} listId={list.id} listName={list.name} tasks={list.tasks} deleteList={deleteList} />
                ))}
            </ul>
        </div>
    );
};

export default Lists;
