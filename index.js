const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config();

port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kr5fm.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {




    const appointmentOptionCollection = client.db('doctors-portal-411').collection('appointmentOptions');
    const bookingCollection = client.db('doctors-portal-411').collection('bookings');
    const userCollection = client.db('doctors-portal-411').collection('users');
    app.get('/appointmentOptions', async (req, res) => {
        const date = req.query.date
        console.log(date);
        const query = {}
        const options = await appointmentOptionCollection.find(query).toArray();
        const bookingQuery = { appointmentDate: date };
        const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();
        options.forEach(option => {
            const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
            const bookedSlots = optionBooked.map(book => book.slot);
            const remainSlot = option.slots.filter(slot => !bookedSlots.includes(slot));
            option.slots = remainSlot;
            console.log(option.name, bookedSlots, remainSlot.length);
        })
        res.send(options)
    })
    // //////////////////////////////////////////

    app.get('/bookings', async (req, res) => {

        const email = req.query.email;
        const query = { email: email };
        const bookings = await bookingCollection.find(query).toArray();
        res.send(bookings);
    })

    app.post('/bookings', async (req, res) => {
        const booking = req.body;
        console.log(booking);
        const query = {
            appointmentDate: booking.appointmentDate,
            email: booking.email,
            treatment: booking.treatment
        }
        const alreadyBooked = await bookingCollection.find(query).toArray();

        if (alreadyBooked.length) {
            const message = `you already have a booking on ${booking.appointmentDate}`
            return res.send({ acknowledged: false, message })
        }
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
    })

    app.post('/users', async (req, res) => {
        const user = req.body;
        console.log(user);
        const result = await userCollection.insertOne(user);
        res.send(result);
    })
}
run().catch(console.log);


app.get('/', async (req, res) => {
    res.send("Doctor portal running");
});

app.listen(port, () => {
    console.log(`Server is running at ${port}`);
});