const request = require('supertest');
const app = require('./app'); // Make sure this points to your main app file

describe('Activities API', () => {
  it('should get all activities', async () => {
    const res = await request(app).get('/api/activities');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array); // Check if response is an array
  });

  it('should create a new activity', async () => {
    const res = await request(app)
      .post('/api/activities')
      .send({ name: 'New Activity' });
    expect(res.statusCode).toEqual(201);
    expect(res.text).toBe('Activity created');
  });

  // Add more tests for PUT, DELETE, etc.
});

