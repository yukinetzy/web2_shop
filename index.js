const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

app.use(express.json());


const url = process.env.MONGO_URI;

const dbName = 'shop';
let db, productsCollection;


MongoClient.connect(url)
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(dbName);
        productsCollection = db.collection('products');
    })
    .catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send(`
        <h1>Practice Task 11-12</h1>
        <ul>
            <li><a href="/api/products">All Products</a></li>
            <li><a href="/api/products/1">Product 1</a></li>
        </ul>
    `);
});

app.get('/api/products', async (req, res) => {
    try {
        const { category, minPrice, sort, fields } = req.query;

        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (minPrice) {
            filter.price = { $gte: Number(minPrice) };
        }

        let projection = {};
        if (fields) {
            fields.split(',').forEach(field => {
                projection[field] = 1;
            });
        }

        let cursor = productsCollection.find(filter, { projection });

        if (sort === 'price') {
            cursor = cursor.sort({ price: 1 });
        }

        const products = await cursor.toArray();

        res.json({
            count: products.length,
            products
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});



app.get('/api/products/:id', async (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/version', (req, res) => {
    res.json({
        version: "1.1",
        updatedAt: "2026-01-25"
    });
});

app.put('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    const { name, price, category } = req.body;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    if (!name || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await productsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { name, price, category } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
        const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/api/products', async (req, res) => {
    const { name, price, category } = req.body;

    if (!name || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newProduct = { name, price, category };

    try {
        const result = await productsCollection.insertOne(newProduct);
        res.status(201).json({ message: 'Product created', productId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
