const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const marklogic = require("marklogic");
const xml2js = require('xml2js');
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

// Function to convert XML to JSON
function xmlToJson(xml) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, { explicitArray: false, trim: true, mergeAttrs: true }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                // Ensure tasks is an array
                if (result.list.tasks && result.list.tasks.task) {
                    let tasks = result.list.tasks.task;
                    if (!Array.isArray(tasks)) {
                        tasks = [tasks];
                    }
                    tasks.forEach(task => {
                        task.completed = task.completed === 'true'; // Convert 'true'/'false' strings to boolean
                    });
                    result.list.tasks = tasks;
                } else {
                    result.list.tasks = [];
                }
                resolve(result.list);
            }
        });
    });
}

// Get all lists
app.get('/lists', (req, res) => {
    db.documents.query(
        marklogic.queryBuilder.where(
            marklogic.queryBuilder.collection('lists')
        )
    ).result()
        .then(documents => {
            const xmlDocuments = documents.map(doc => doc.content);
            const jsonPromises = xmlDocuments.map(xmlToJson);
            return Promise.all(jsonPromises);
        })
        .then(lists => {
            res.json(lists);
        })
        .catch(error => {
            console.error('Error fetching lists:', error);
            res.status(500).send('Error fetching lists');
        });
});

// Create list
app.post('/lists', (req, res) => {
    const newList = req.body; // Assuming req.body contains { id: 'ListID', name: 'List Name', tasks: [] }
    const uri = '/lists/' + newList.id + '.xml'; // Example URI

    const xmlList = `
        <list>
            <id>${newList.id}</id>
            <name>${newList.name}</name>
            <tasks>
                ${newList.tasks.map(task => `
                    <task>
                        <id>${task.id}</id>
                        <name>${task.name}</name>
                        <completed>${task.completed}</completed>
                    </task>
                `).join('')}
            </tasks>
        </list>
    `;

    db.documents.write({
        uri: uri,
        collections: ['lists'],
        contentType: 'application/xml',
        content: xmlList
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

    db.documents.remove('/lists/' + listId + '.xml')
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

    db.documents.read('/lists/' + listId + '.xml')
        .result()
        .then(documents => {
            const existingList = documents[0].content;
            // Convert XML to JS object, modify it, and convert back to XML
            const updatedList = existingList.replace(/<name>.*<\/name>/, `<name>${newName}</name>`);

            return db.documents.write({
                uri: '/lists/' + listId + '.xml',
                collections: ['lists'],
                contentType: 'application/xml',
                content: updatedList
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
    const newTask = req.body; // Assuming req.body contains { id: 'TaskID', name: 'Task Name', completed: false }

    db.documents.read('/lists/' + listId + '.xml')
        .result()
        .then(document => {
            let list = document[0].content;
            const taskXml = `
                <task>
                    <id>${newTask.id}</id>
                    <name>${newTask.name}</name>
                    <completed>${newTask.completed}</completed>
                </task>
            `;

            list = list.replace(/<\/tasks>/, `${taskXml}</tasks>`);

            return db.documents.write({
                uri: '/lists/' + listId + '.xml',
                collections: ['lists'],
                contentType: 'application/xml',
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

    db.documents.read('/lists/' + listId + '.xml')
        .result()
        .then(document => {
            let list = document[0].content;
            const taskRegex = new RegExp(`<task>\\s*<id>${taskId}<\\/id>[\\s\\S]*?<\\/task>`, 'g');
            list = list.replace(taskRegex, '');

            return db.documents.write({
                uri: '/lists/' + listId + '.xml',
                collections: ['lists'],
                contentType: 'application/xml',
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

    db.documents.read('/lists/' + listId + '.xml')
        .result()
        .then(document => {
            let list = document[0].content;
            const taskRegex = new RegExp(`(<task>\\s*<id>${taskId}<\\/id>[\\s\\S]*?<completed>)(false|true)(<\\/completed>)`);
            list = list.replace(taskRegex, '$1true$3');

            return db.documents.write({
                uri: '/lists/' + listId + '.xml',
                collections: ['lists'],
                contentType: 'application/xml',
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

    db.documents.read('/lists/' + listId + '.xml')
        .result()
        .then(document => {
            let list = document[0].content;
            const taskRegex = new RegExp(`(<task>\\s*<id>${taskId}<\\/id>[\\s\\S]*?<completed>)(false|true)(<\\/completed>)`);
            list = list.replace(taskRegex, '$1false$3');

            return db.documents.write({
                uri: '/lists/' + listId + '.xml',
                collections: ['lists'],
                contentType: 'application/xml',
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

    db.documents.read('/lists/' + listId + '.xml')
        .result()
        .then(document => {
            let list = document[0].content;
            const taskRegex = new RegExp(`(<task>\\s*<id>${taskId}<\\/id>[\\s\\S]*?<name>)[\\s\\S]*?(<\\/name>)`);
            list = list.replace(taskRegex, `$1${updatedTask.name}$2`);

            return db.documents.write({
                uri: '/lists/' + listId + '.xml',
                collections: ['lists'],
                contentType: 'application/xml',
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
