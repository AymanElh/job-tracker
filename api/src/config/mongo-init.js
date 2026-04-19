
db = db.getSiblingDB('jobtrackr');

db.createUser({
    user: process.env.MONGO_APP_USER || 'jobtrackr_app',
    pwd:  process.env.MONGO_APP_PASS || 'mongo-user',
    roles: [
        { role: 'readWrite', db: 'jobtrackr' }
    ]
})

print('App user created successfully');