const functions = require('firebase-functions')
const crypto = require('crypto')
const QRCode = require('qrcode')
const cors = require('cors')({ origin: true })
const admin = require('firebase-admin')

admin.initializeApp();
const pools = admin.database().ref('/pools')

exports.getParticipants = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== 'GET') {
      return res.status(404).json({
        message: 'Not allowed'
      })
    }

    let participants = [];

    return pools.child(req.query.pool).child('participants').on('value', (snapshot) => {
      snapshot.forEach((participant) => {
        participants.push({
          name: participant.val().name,
          email: participant.val().email
        });
      });

      res.status(200).json(participants)
    }, (error) => {
      res.status(error.code).json({
        message: `Something went wrong. ${error.message}`
      })
    })
  })
})

exports.getPools = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== 'GET') {
      return res.status(404).json({
        message: 'Not allowed'
      })
    }

    let poolsList = [];

    return pools.on('value', (snapshot) => {
      snapshot.forEach((pool) => {
        poolsList.push({
          name: pool.key
        });
      });

      res.status(200).json(poolsList)
    }, (error) => {
      res.status(error.code).json({
        message: `Something went wrong. ${error.message}`
      })
    })
  })
})

exports.addParticipant = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
   if(req.method !== 'POST') {
    return res.status(401).json({
     message: 'Not allowed'
    })
   }
   const person = {
     name: req.body.name,
     email: req.body.email
   }
   const hashName = crypto.createHash('md5').update(person.email).digest("hex")
   const participant = pools.child(req.body.pool).child('participants').child(hashName)
   participant.set(person);
   return participant.on('value', (snapshot) => {
    res.status(200).json(snapshot.val())
   }, (error) => {
    res.status(error.code).json({
      message: `Something went wrong. ${error.message}`
    })
   })
  })
})

exports.newParticipant = functions.https.onRequest((req, res) => {
  res.send(`<html><head><title>${req.query.pool}</title></head><body>A form here</body></html>`)
  res.status(200)
})

exports.generateQrCode = functions.https.onRequest((req, res) => {
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG)
  const baseURL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/newParticipant?pool=`
  const poolUrl = baseURL + req.query.pool.toLowerCase().trim().replace(/ +/g, '-')
  QRCode.toDataURL(poolUrl, (err, url) => {
    if (err) {
      console.log(err)
      res.status(500)
    }
    const htmlToRender = `<html><head></head><body><img src="${url}"></body></html>`
    res.send(htmlToRender)
    res.status(200)
  })
})

exports.index = functions.https.onRequest((req, res) => {
  res.send("Welcome to The Raffle!")
  res.status(200)
})
