"use latest"

const MongoClient = require('mongodb').MongoClient

const save_product = (message) => (db, cb) => {
  const product = message.split('quantity:')[0].trim()
  const quantity = message.split('quantity:')[1]
  const doc = {
    product,
    quantity: quantity ? quantity.trim() : '1'
  }

  const opts = {
    upsert: true
  }

  db
    .collection('shopping')
    .updateOne( { product: doc.product }, doc, opts, (err) => {
      if(err) return cb(err)

      cb(null)
    })
}

const remove_products = (db, cb) => {
  db
    .collection('shopping')
    .remove((err) => {
      if(err) return cb(err)

      cb(null)
    })
}

const save_products = (db, cb) => {
  db
    .collection('shopping')
    .find().toArray((err, products) => {
      if(err) return cb(err)

      db
        .collection('purchases')
        .insert({ products: products.map(item => ({ product: item.product, quantity: item.quantity })), created_at: new Date() }, err => {
          if(err) return cb(err)

          remove_products(db, cb)
        })
    })
}

module.exports = (ctx, done) => {
  const message = ctx.data.message
  const cb = (err) => err ? done(err) : done(null, 'Success')

  MongoClient.connect(ctx.data.MONGO_URL, (err, db) => {
    if(err) return done(err)

    switch (message) {
      case 'clean' :
        remove_products(db, cb)
        break

      case 'save' :
        save_products(db, cb)
        break

      default: 
        save_product(message)(db, cb)
    }
  })
}
