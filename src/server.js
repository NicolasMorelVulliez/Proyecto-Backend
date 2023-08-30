const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 8080;



app.use(express.json());

const productsFilePath = path.join(__dirname, 'productos.json');
const cartsFilePath = path.join(__dirname, 'carrito.json');

// Manejo de errores genérico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

// Rutas para productos
const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
    try {
        const productsData = await fs.readFile(productsFilePath, 'utf-8');
        const products = JSON.parse(productsData);
        const limit = req.query.limit || products.length;
        res.json(products.slice(0, limit));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

productsRouter.get('/:pid', async (req, res) => {
    try {
        const productsData = await fs.readFile(productsFilePath, 'utf-8');
        const products = JSON.parse(productsData);

        // Convertir el ID proporcionado en la URL a un número
        const productId = parseInt(req.params.pid);

        const product = products.find(item => item.id === productId);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});


// Define una variable para llevar el registro del último ID utilizado
let lastProductId = 0;

// Lee el archivo de productos al iniciar la aplicación para obtener el último ID utilizado
fs.readFile(productsFilePath, 'utf-8')
    .then(productsData => {
        const products = JSON.parse(productsData);
        if (products.length > 0) {
            lastProductId = products[products.length - 1].id;
        }
    })
    .catch(err => {
        console.error('Error al leer el archivo de productos:', err);
    });

// Rutas para productos

productsRouter.post('/', async (req, res) => {
    try {
        const productsData = await fs.readFile(productsFilePath, 'utf-8');
        const products = JSON.parse(productsData);

        const newProduct = {
            id: ++lastProductId, // Incrementar el último ID y asignarlo
            ...req.body,
            status: true,
        };

        products.push(newProduct);

        await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
        res.json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar el producto' });
    }
});



productsRouter.put('/:pid', async (req, res) => {
    try {
        const productsData = await fs.readFile(productsFilePath, 'utf-8');
        const products = JSON.parse(productsData);

        const index = products.findIndex(item => item.id === req.params.pid);

        if (index !== -1) {
            products[index] = { ...products[index], ...req.body };
            await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
            res.json(products[index]);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

productsRouter.delete('/:pid', async (req, res) => {
    try {
        const productsData = await fs.readFile(productsFilePath, 'utf-8');
        let products = JSON.parse(productsData);

        products = products.filter(item => item.id !== req.params.pid);

        await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

app.use('/api/products', productsRouter);

// Rutas para carritos
const cartsRouter = express.Router();

cartsRouter.post('/', async (req, res) => {
    try {
        const cartsData = await fs.readFile(cartsFilePath, 'utf-8');
        const carts = JSON.parse(cartsData);

        const newCart = {
            id: uuidv4(), // Generar un nuevo ID
            products: [],
        };

        carts.push(newCart);

        await fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2));
        res.json(newCart);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el carrito' });
    }
});

cartsRouter.get('/:cid', async (req, res) => {
    try {
        const cartsData = await fs.readFile(cartsFilePath, 'utf-8');
        const carts = JSON.parse(cartsData);

        const cart = carts.find(item => item.id === req.params.cid);

        if (cart) {
            res.json(cart.products);
        } else {
            res.status(404).json({ error: 'Carrito no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartsData = await fs.readFile(cartsFilePath, 'utf-8');
        const carts = JSON.parse(cartsData);

        const cartIndex = carts.findIndex(item => item.id === req.params.cid);
        const productIndex = carts[cartIndex].products.findIndex(item => item.product === req.params.pid);

        if (productIndex !== -1) {
            carts[cartIndex].products[productIndex].quantity++;
        } else {
            carts[cartIndex].products.push({
                product: req.params.pid,
                quantity: 1,
            });
        }

        await fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2));
        res.json(carts[cartIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar el producto al carrito' });
    }
});

app.use('/api/carts', cartsRouter);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
