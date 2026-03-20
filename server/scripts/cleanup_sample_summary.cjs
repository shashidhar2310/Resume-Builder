const mongoose = require('mongoose')
const Resume = require('../models/Resume').default || require('../models/Resume')
const fs = require('fs')
require('dotenv').config({ path: __dirname + '/../.env' })

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI

async function run(){
  if(!MONGODB_URI){
    console.error('MONGODB_URI not found in .env')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI)
  console.log('Connected to DB')

  const SAMPLE = 'Sample resume text for debugging upload endpoint. Replace with PDF-extracted text when fixed.'

  const res = await Resume.updateMany({ professional_summary: SAMPLE }, { $set: { professional_summary: '' } })
  console.log('Matched:', res.matchedCount, 'Modified:', res.modifiedCount)
  await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })
