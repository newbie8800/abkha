require("dotenv").config();
process.env



var express = require('express'),
    path = require('path'),
    http = require('http'),
    bodyParser = require('body-parser'),
    cons = require('consolidate'),
    dust = require('dustjs-helpers'),
    pg = require('pg'),
    multer = require("multer"),
    imageToBase64 = require("image-to-base64"),
    app = express(),
    server = http.createServer(app);

const config = {
   
    PGHOST:'ep-rough-mouse-182744.us-east-2.aws.neon.tech',
    PGDATABASE:'recipes2',
    PGUSER:'newbie8800',
    PGPASSWORD:'7JgKipt6hEZS',
    ENDPOINT_ID:'ep-rough-mouse-182744',
    ssl:true

};

const pool = new pg.Pool(config);


var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/userimages");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage: Storage,
}).single("image");

var fs = require('fs');

var directory = "public/userimages";
//assign dust engine to .dust files
app.engine('dust', cons.dust);

//set default ext .dust
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

//set public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public/userimages"));

app.get('/', function (req, res) {

    pool.connect(function (err, client, done) { //this in
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('SELECT * FROM recipes2', function (err, result) {

            if (err) {
                return console.error('error running query', err);
            }
            res.render('index', { recipes2: result.rows });
            done();
        });
    });
});

app.post('/add', upload, function (req, res) {



    pool.connect(function (err, client, done) { //this in

        if (err) {
            return console.error('error fetching client from pool', err);
        }
   
        imageToBase64(req.file.path) // Path to the image//this
            .then((response) => {//this

                var data = (response);//this

                client.query("INSERT INTO recipes2(name, ingredients, directions, sources) VALUES($1, $2, $3, $4)", [req.body.name, req.body.ingredients, req.body.directions, data]);
 
                fs.readdir(directory, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        fs.unlink(path.join(directory, file), err => {
                            if (err) throw err;
                        });
                    }
                });
              
                done();
                res.redirect('/');

            }) //this



    });



});


app.delete('/delete/:id', function (req, res) {

    pool.connect(function (err, client, done) { //this in
        if (err) {
            return console.error('error fetching client from pool', err);
        }


        pool.query(`SELECT sources FROM recipes2 WHERE id=${req.params.id}`, (err, result) => {

            if (err) return console.log('error in query', err);

        
            fs.readdir(directory, (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(path.join(directory, file), err => {
                        if (err) throw err;
                    });
                }
            });
          
            client.query("DELETE FROM recipes2 WHERE id = $1", [req.params.id]);
            done();
            res.sendStatus(200);

        });

    });
});

app.post('/edit', upload, function (req, res) {



    pool.connect(function (err, client, done) { //this in
        if (err) {
            return console.error('error fetching client from pool', err);
        }


        pool.query(`SELECT sources FROM recipes2 WHERE id=${req.body.id}`, (err, result) => {
            if (err) return console.log('error in query', err);

            try {


                imageToBase64(req.file.path) // Path to the image
                .then((response) => {
                 
    
                    var data = (response);
    
 
                   client.query("UPDATE recipes2 SET name=$1, ingredients=$2, directions=$3, sources=$4 WHERE id = $5", [req.body.name, req.body.ingredients, req.body.directions, data, req.body.id]);
                   
                    fs.readdir(directory, (err, files) => {
                        if (err) throw err;
    
                        for (const file of files) {
                            fs.unlink(path.join(directory, file), err => {
                                if (err) throw err;
                            });
                        }
                    });
                 
                    done();
                    res.redirect('/');
    
                })
                
   
            } catch (err) {
                console.log("error while deleting the file" + err);
            }

        });

    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log (`Server running on port ${PORT}`));