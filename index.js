const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || "postgres://camil:coding@localhost/the_acme_flavors_db");
const app = express();

app.use(require('morgan')('dev'));
app.use(express.json());

app.get("/api/flavors", async (req, res, next) => {
    try {
        const SQL = `SELECT * from flavors ORDER BY created_at DESC`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

app.get("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM flavors WHERE id = $1`;
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

app.post("/api/flavors", async (req, res, next) => {
    try {
        const { name, is_favorite } = req.body;
        const SQL = `INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *`;
        const response = await client.query(SQL, [name, is_favorite]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = `DELETE FROM flavors WHERE id = $1`;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

app.put("/api/flavors/:id", async (req, res, next) => {
    try {
        const { name, is_favorite } = req.body;
        const SQL = `UPDATE flavors SET name = $1, is_favorite = $2, updated_at = now() WHERE id = $3 RETURNING *`;
        const response = await client.query(SQL, [name, is_favorite, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});


const init = async () => {
    await client.connect()
    console.log('connected to database');
    
    let SQL = /* sql */ `
        DROP TABLE IF EXISTS flavors; 
        CREATE TABLE flavors(
        id SERIAL PRIMARY KEY, 
        name VARCHAR(50) NOT NULL, 
        is_favorite BOOLEAN,
        created_at TIMESTAMP DEFAULT now(), 
        updated_at TIMESTAMP DEFAULT now()
        );

    `;

    await client.query(SQL);
    console.log('tables created');
    
    SQL = `
         INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', true);
         INSERT INTO flavors(name, is_favorite) VALUES('Chocolate', false);
        INSERT INTO flavors(name, is_favorite) VALUES('Strawberry', true);
    `;

    await client.query(SQL);
    console.log('data seeded');
    
    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();