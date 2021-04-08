const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cors = require("cors")
require('dotenv').config()

const port = 4000

app.use(cors());
app.use(bodyParser.json())

//from firebase > service account
const admin = require('firebase-admin');
const serviceAccount = require('./burj-al-arab-84278-firebase-adminsdk-pxll5-8efc3aedda.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://burj-al-arab-84278.firebaseio.com'
});
// end code

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6gnbd.mongodb.net/burj-al-arab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db("burj-al-arab").collection("booking");
    // perform actions on the collection object
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        collection.insertOne(newBooking)
            .then(result => {
                console.log(result)
            })
        console.log(newBooking)
    })
    // idToken comes from the client app

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1]
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email
                    if (tokenEmail == queryEmail) {
                        collection.find({ email: queryEmail })
                            .toArray((err, document) => {
                                res.send(document)
                            })
                    }
                    else {
                        res.status(401).send('Unauthorized Access')
                    }
                })
                .catch(error => {
                    res.status(401).send('Unauthorized Access')
                });
        }
        else {
            res.status(401).send('Unauthorized Access')
        }

    })
    app.get('/', (req, res) => {
        res.send('Hello World!')
    })
});



app.listen(port)