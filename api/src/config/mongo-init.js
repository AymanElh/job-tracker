
db = db.getSiblingDB('jobtrackr');

db.createUser({
    user: process.env.MONGO_APP_USER,
    pwd:  process.env.MONGO_APP_PASS,
    roles: [
        { role: 'readWrite', db: 'jobtrackr' }
    ]
})

print('App user created successfully');