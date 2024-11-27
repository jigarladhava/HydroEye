const express = require('express');
const app = express();
const odbc = require('odbc');

// Middleware to parse JSON data
app.use(express.json());

// Endpoint to handle POST requests with SQL queries
app.post('/query', (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }
    console.log(req);

    // Check if the query starts with SELECT
    const isSelectQuery = /^SELECT\s+/i.test(query);
    if (!isSelectQuery) {
        return res.status(400).json({ error: 'Only SELECT queries are allowed' });
    }


    // Connection string
    const connectionString = `DSN=CLEARSCADA;UID=ENGINEER;PWD=Engineer@123`;

    // Connect to the database
    try {

        odbc.connect(connectionString, (error, connection) => {
            if (error) {
                console.error('Connection error:', error);
                return res.status(500).json({ error: 'Database connection error' });
            }

            // Execute the SQL query
            console.log('Query :', query);
            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Query error:', error);
                    connection.close(() => {
                        return res.status(500).json({ error: 'Database query error' });
                    });
                }

                // Process the query result

                else
                    console.log('Query result:', result.length);

                // Close the connection
                connection.close((error) => {
                    if (error) {
                        console.error('Error closing connection:', error);
                    }
                });

                // Send the query result as JSON response
                res.json({ result });
            });
        });
    } catch (ex) {
        res.json({ err: 'Database error' });
    }

});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});




