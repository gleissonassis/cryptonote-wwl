var request               = require('supertest');
var chai                  = require('chai');
var expect                = chai.expect;
var BOFactory             = require('../../../src/business/boFactory');

describe('api', function(){
  var server = null;
  var userBO = BOFactory.getBO('user');
  var contactBO = BOFactory.getBO('contact');

  var user = {
    name: 'User',
    email: 'user@gmail.com',
    password: '123456',
    role: 'user',
    confirmation: {
      key: '1'
    },
    internalKey: '1'
  };

  var connectionInfo = {
    ip: 'fake',
    userAgent: 'fake'
  };

  before(function(){
    server = require('../../../src/server');
    var chain = Promise.resolve();

    return chain
      .then(function() {
        return userBO.clear();
      })
      .then(function() {
        return userBO.createUserWithoutValidations(user);
      })
      .then(function(r) {
        user.id = r.id;
        return userBO.generateToken(user.email, user.password, connectionInfo);
      })
      .then(function(r) {
        user.token = r.token;
        return contactBO.clear();
      });
  });

  after(function(){
    var chain = Promise.resolve();

    return chain
      .then(function() {
        return userBO.clear();
      })
      .then(function() {
        return contactBO.clear();
      });
  });

  describe('/v1/contacts', function(){
    describe('basic token validation', function(){
      it('should fail to perform GET to the route /contacts without a token (403)', function() {
        return request(server)
          .get('/v1/contacts')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform POST to the route /contacts without a token (403)', function() {
        return request(server)
          .post('/v1/contacts')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform GET the route /contacts without a token (404)', function() {
        return request(server)
          .get('/v1/contacts/fake-id')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform DELETE to the route /contacts/id without a token (403)', function() {
        return request(server)
          .delete('/v1/contacts/fake-id')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });
    });

    it('should list contacts with a valid token', function() {
      return request(server)
        .get('/v1/contacts')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('should store a new contact', function() {
      var entityId = null;

      return request(server)
        .post('/v1/contacts')
        .send({
            address: 'address',
            name: 'name',
          })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(201)
        .then(function(res) {
          expect(res.body).to.have.property('id');
          expect(res.body.address).to.be.equal('address');
          expect(res.body.name).to.be.equal('name');

          return res.body.id;
        })
        .then(function(id) {
          entityId = id;
          return request(server)
            .get('/v1/contacts')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + user.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function(res) {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(res.body[0].id).to.be.equal(entityId);
        });
    });

    it('should update a contact', function() {
      var entityId = null;

      return request(server)
        .get('/v1/contacts')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res) {
          entityId = res.body[0].id;
          return request(server)
            .put('/v1/contacts/' + entityId)
            .send({
              name: 'new name'
            })
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + user.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function(res) {
          expect(res.body.id).to.be.equal(entityId);
          expect(res.body.name).to.be.equal('new name');
          expect(res.body.address).to.be.equal('address');
        });
    });

    it('should disable a contact with a user token', function() {
      var entityId = null;

      return request(server)
        .get('/v1/contacts')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res) {
          entityId = res.body[0].id;
          return request(server)
            .delete('/v1/contacts/' + entityId)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + user.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function() {
          return request(server)
            .get('/v1/contacts/' + entityId)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + user.token)
            .expect('Content-Type', /json/)
            .expect(404);
        });
    });
  });
});
