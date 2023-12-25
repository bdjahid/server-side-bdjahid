const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const app = express();
require('dotenv').config();
var cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;

// middleware
//  use for token
// const corsConfig = {
//     origin: ['http://localhost:5174','https://b8a11-client-side-bdjahid.web.app/'],
//     credentials: true,
//     methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
// }

app.use(cors({
    origin: ['http://localhost:5174', 'https://b8a11-client-side-bdjahid.web.app'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
}))
app.use(cookieParser())
app.use(express.json())

// middlewares
const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl)
    next()
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token in middleware', token)
    if (!token) {
        return res.status(401).send({ message: 'not authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({ message: 'unauthorized' })
        }
        console.log('value in the token', decoded)
        req.user = decoded;
        next()
    })


}





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xipfv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();




        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

const serviceCollection = client.db('tours-guide').collection('services')
const bookingCollection = client.db('tours-guide').collection('bookings')
const productCollection = client.db('tours-guide').collection('product')

app.post('/jwt', logger, async (req, res) => {
    const user = req.body;
    console.log(user);
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
    // const token = jwt.sign(user, secret, { expiresIn: '2h' })
    res
        .cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        })
        .send({ success: true })
})

app.post('/logout', async (req, res) => {
    const user = req.body;
    console.log('logging out', user)
    res.clearCookie('token', { maxAge: 0 }).send({ success: true })
});

app.get('/services', async (req, res) => {
    const cursor = serviceCollection.find();
    const result = await cursor.toArray();
    res.send(result)
})
app.get('/services', async (req, res) => {
    const { q } = req.query;
    console.log(q)
    const cursor = serviceCollection.find(query);
    const result = await cursor.toArray();
    res.send(result)
})


app.get('/services/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await serviceCollection.findOne(query)
    res.send(result)
})

// add product

app.get('/product', logger, async (req, res) => {
    console.log(req.query.email);

    let query = {}
    if (req.query?.email) {
        query = { email: req.query.email }
    }
    const result = await productCollection.find(query).toArray();
    res.send(result)
})

app.get('/product/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id)
    const query = { _id: new ObjectId(id) }
    const result = await productCollection.findOne(query)
    res.send(result)
})

app.post('/product', async (req, res) => {
    const product = req.body;
    console.log(product)
    const result = await productCollection.insertOne(product);
    res.send(result)
})

app.put('/product/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id)
    const filter = { _id: new ObjectId(id) }
    const options = { upsert: true };
    const updateService = req.body;
    const service = {
        $set: {
            area: updateService.area,
            description: updateService.description,
            photo: updateService.photo,
            price: updateService.price,
            service: updateService.service
        }
    }
    const result = await productCollection.updateOne(filter, service, options)
    res.send(result)
})

app.delete('/product/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id)
    const query = { _id: new ObjectId(id) }
    const result = await productCollection.deleteOne(query)
    res.send(result)
})

// post bookings

app.get('/bookings', logger, verifyToken, async (req, res) => {
    console.log(req.query.email);
    // console.log('json web token', req.cookies)
    console.log('user in the valid token', req.user)

    if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden access' })
    }
    let query = {}
    if (req.query?.email) {
        query = { email: req.query.email }
    }
    const result = await bookingCollection.find(query).toArray();
    res.send(result)
})

app.post('/bookings', async (req, res) => {
    const booking = req.body;
    console.log(booking)
    const result = await bookingCollection.insertOne(booking);
    res.send(result)
})




app.get('/', (req, res) => {
    res.send('server side is running')
})


app.listen(port, () => {
    console.log(`server is running on port: ${port}`)
})