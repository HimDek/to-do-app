const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const marklogic = require("marklogic");
const app = express();

// Configure MarkLogic client
const db = marklogic.createDatabaseClient({
    user: process.env.MARKLOGIC_USER || "your-marklogic-username",
    password: process.env.MARKLOGIC_PASSWORD || "your-marklogic-password",
    host: process.env.MARKLOGIC_HOST || "localhost",
    port: process.env.MARKLOGIC_PORT || "8000",
    authType: process.env.MARKLOGIC_AUTH_TYPE || "digest", // Adjust as per your MarkLogic authentication type
    database: process.env.MARKLOGIC_DATABASE || "your-marklogic-database", // Adjust as per your MarkLogic database name
});

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Routes
app.get("/", (req, res) => res.send("Hello World!"));

// Get all lists
app.get('/lists', (req, res) => {
    db.documents.query(
        marklogic.queryBuilder.where(
            marklogic.queryBuilder.collection('lists')
        )
    ).result()
        .then(documents => {
            const lists = documents.map(doc => doc.content);
            res.json(lists);
        })
        .catch(error => {
            console.error('Error fetching lists:', error);
            res.status(500).send('Error fetching lists');
        });
});

// Create list
app.post('/lists', (req, res) => {
    const newList = req.body; // Assuming req.body contains { name: 'List Name', tasks: [] }
    const uri = '/lists/' + newList.id + '.json'; // Example URI

    db.documents.write({
        uri: uri,
        collections: ['lists'],
        content: newList
    }).result()
        .then(() => {
            res.send(newList);
        })
        .catch(error => {
            console.error('Error creating list:', error);
            res.status(500).send('Error creating list');
        });
});

// Delete list
app.delete('/lists/:id', (req, res) => {
    const listId = req.params.id;

    db.documents.remove('/lists/' + listId + '.json')
        .result()
        .then(() => {
            res.send({ message: 'List deleted successfully' });
        })
        .catch(error => {
            console.error('Error deleting list:', error);
            res.status(500).send('Error deleting list');
        });
});

// Edit list name
app.put('/lists/:id', (req, res) => {
    const listId = req.params.id;
    const newName = req.body.name; // Assuming req.body contains { name: 'New List Name' }

    db.documents.read('/lists/' + listId + '.json')
        .result()
        .then(documents => {
            const existingList = documents[0].content;
            existingList.name = newName;

            return db.documents.write({
                uri: '/lists/' + listId + '.json',
                collections: ['lists'],
                content: existingList
            }).result();
        })
        .then(() => {
            res.send({ message: 'List updated successfully' });
        })
        .catch(error => {
            console.error('Error updating list:', error);
            res.status(500).send('Error updating list');
        });
});


// Add task to list
app.post('/lists/:listId/tasks', (req, res) => {
    const listId = req.params.listId;
    const newTask = req.body; // Assuming req.body contains { name: 'Task Name', completed: false }

    db.documents.read('/lists/' + listId + '.json')
        .result()
        .then(document => {
            const list = document[0].content;
            list.tasks.push(newTask);

            return db.documents.write({
                uri: '/lists/' + listId + '.json',
                collections: ['lists'],
                content: list
            }).result();
        })
        .then(() => {
            res.send(newTask);
        })
        .catch(error => {
            console.error('Error adding task:', error);
            res.status(500).send('Error adding task');
        });
});

// Delete task from list
app.delete('/lists/:listId/tasks/:taskId', (req, res) => {
    const listId = req.params.listId;
    const taskId = req.params.taskId;

    db.documents.read('/lists/' + listId + '.json')
        .result()
        .then(document => {
            const list = document[0].content;
            list.tasks = list.tasks.filter(task => String(task.id) !== String(taskId));

            return db.documents.write({
                uri: '/lists/' + listId + '.json',
                collections: ['lists'],
                content: list
            }).result();
        })
        .then(() => {
            res.send({ message: 'Task deleted successfully' });
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            res.status(500).send('Error deleting task');
        });
});

// Mark task as complete
app.put('/lists/:listId/tasks/:taskId/complete', (req, res) => {
    const listId = req.params.listId;
    const taskId = req.params.taskId;

    db.documents.read('/lists/' + listId + '.json')
        .result()
        .then(document => {
            const list = document[0].content;
            const task = list.tasks.find(task => String(task.id) === String(taskId));
            if (task) {
                task.completed = true; // Mark task as completed
            } else {
                throw new Error('Task not found');
            }

            return db.documents.write({
                uri: '/lists/' + listId + '.json',
                collections: ['lists'],
                content: list
            }).result();
        })
        .then(() => {
            res.send({ message: 'Task marked as complete' });
        })
        .catch(error => {
            console.error('Error marking task as complete:', error);
            res.status(500).send('Error marking task as complete');
        });
});

// Unmark task as complete
app.put('/lists/:listId/tasks/:taskId/uncomplete', (req, res) => {
    const listId = req.params.listId;
    const taskId = req.params.taskId;

    db.documents.read('/lists/' + listId + '.json')
        .result()
        .then(document => {
            const list = document[0].content;
            const task = list.tasks.find(task => String(task.id) === String(taskId));
            if (task) {
                task.completed = false;
            } else {
                throw new Error('Task not found');
            }

            return db.documents.write({
                uri: '/lists/' + listId + '.json',
                collections: ['lists'],
                content: list
            }).result();
        })
        .then(() => {
            res.send({ message: 'Task unmarked as complete' });
        })
        .catch(error => {
            console.error('Error marking task as incomplete:', error);
            res.status(500).send('Error marking task as incomplete');
        });
});

// Edit task name
app.put('/lists/:listId/tasks/:taskId', (req, res) => {
    const listId = req.params.listId;
    const taskId = req.params.taskId;
    const updatedTask = req.body; // Assuming req.body contains { name: 'New Task Name' }

    db.documents.read('/lists/' + listId + '.json')
        .result()
        .then(document => {
            const list = document[0].content;
            const task = list.tasks.find(task => String(task.id) === String(taskId));
            if (task) {
                task.name = updatedTask.name; // Update task name
            } else {
                throw new Error('Task not found');
            }

            return db.documents.write({
                uri: '/lists/' + listId + '.json',
                collections: ['lists'],
                content: list
            }).result();
        })
        .then(() => {
            res.send({ message: 'Task name updated successfully' });
        })
        .catch(error => {
            console.error('Error updating task name:', error);
            res.status(500).send('Error updating task name');
        });
});

const port = process.env.BACKEND_PORT || 3001;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
