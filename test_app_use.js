import express from 'express';
const app = express();

app.get('/api/users', (req, res) => {
    res.json({ users: [] });
});

app.use(express.static('dist'));

app.get(/^\/(?!api\/|direct-admin|admin\.html).*/, (req, res) => {
    res.send("CATCHALL");
});

app.listen(3001, () => {
    console.log("Started on 3001");
});
