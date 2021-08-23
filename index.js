const express = require('express')
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const passport = require('passport')
const app = express()
const axios = require('axios')
const fs = require('fs')
app.set('view engine','ejs')

// chiamate post con BODY
app.use(express.urlencoded())
app.use(express.static('public'))

// require('./routes')(app)

passport.use(new MicrosoftStrategy({
    clientID: '03f688a2-70f6-4eef-b34e-9d6a0eeaddb7',
    clientSecret: 'ZxgN-Njhn~lDeBTDc6k~842~_.r_rh3N7_',
    callbackURL: "http://localhost:3000/auth/microsoft/callback",
    scope: ['Files.ReadWrite']
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken, refreshToken, profile)
    // User.findOrCreate({ userId: profile.id }, function (err, user) {
    //   return done(err, user);
    // });
    // done(accessToken)
    done(accessToken)
  }
));


app.use(passport.initialize());
app.use(passport.session());

app.get('/',(req,res,next) => {
  const {token} = req.query
  if (token){
    console.log('logged!',token)
    return res.render('index',{token})
  }
  res.redirect('/auth/microsoft')

})

app.get('/auth/microsoft',
passport.authenticate('microsoft'));


app.get('/file/:path', async (req, res) => {
  try{

    console.log(req.params.path)
    const {token} = req.query
    const {path} = req.params
    if (token){
      axios.defaults.headers.common['Authorization'] = token;
      const [contentReq, infoReq] = await Promise.all([
        axios.get(`https://graph.microsoft.com/v1.0/drive/root:/${path}:/content`,{ 
          responseType: 'arraybuffer' 
        }),
        axios.get(`https://graph.microsoft.com/v1.0/me/drive/root:/${path}`),
      ])
      console.count()
      // res.setHeader("Content-Disposition", `attachment; filename="${infoReq.data.name}"`)
      // fs.writeFile('prova.png', contentReq.data, ()=>  {})
      
      const headers = {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment;filename="${infoReq.data.name}"` // Needed to enforce correct filename in Chrome.)
      }
      res.writeHead(200, headers)
      return Buffer.from(contentReq.data, 'binary')
      // const bufferizzato = Buffer.from(contentReq.data, 'binary')
      // return res.send(bufferizzato) 
      
      // res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8,base64'});
      // res.write('<html><body><img src="data:image/jpg;base64,')
      // res.write(new Buffer(contentReq.data).toString('base64'));
      // res.end('"/></body></html>');
    }
    res.send('Unauthorized')
  } catch(e){
    console.log(e)
    res.send(e)
  }
})

app.get('/auth/microsoft/callback', 
// passport.authenticate('microsoft', {  successRedirect: '/', failureRedirect: '/login' }),
function(req, res,next) {
  // Successful authentication, redirect home.

  passport.authenticate('microsoft', function(err, user, info) {
    if (err && typeof err === 'object') {
      // controllo il tipo perché se il itpo è stringa mi arriva il token :/ da capire meglio
      return next(err);
    }
    console.log('qui passi?')
    res.redirect(`/?token=${err}`);
    
  })(req, res, next);
});

//
app.use((req,res,next)=>{
    const title ='page not found!'
    res
        .status(404)
        .render('404', {
            title: '404'
        })
})

app.listen(3000)